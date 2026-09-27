"""Inject Morph transitions, auto-advance timings and auto-playing entrance
animations into the pptxgenjs output. String-level edits only (no XML
round-tripping) so namespace prefixes stay exactly as PowerPoint expects.

usage: python3 deck/postprocess.py deck/build/raw.pptx deck/build/anim.json deck/Nova_Showreel.pptx
"""
import json, re, sys, zipfile

src, spec_path, dst = sys.argv[1:4]
spec = json.load(open(spec_path))

P14 = 'xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"'
MC = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'


def transition(i, adv, dur):
    adv_attr = f' advTm="{adv}"' if adv else ""
    if i == 0:  # first slide: fade in from black
        return f'<p:transition spd="slow"{adv_attr}><p:fade/></p:transition>'
    return (
        f'<mc:AlternateContent {MC}>'
        f'<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
        f'<p:transition spd="slow" p14:dur="{dur}"{adv_attr}><p159:morph option="byObject"/></p:transition>'
        f'</mc:Choice><mc:Fallback><p:transition spd="slow"{adv_attr}><p:fade/></p:transition></mc:Fallback>'
        f'</mc:AlternateContent>'
    )


class Ids:
    def __init__(self): self.n = 3
    def __call__(self): self.n += 1; return self.n


def build_list(spids, kinds):
    out = []
    for sid in dict.fromkeys(spids):
        k = kinds.get(sid)
        if k == "sp":
            out.append(f'<p:bldP spid="{sid}" grpId="0" animBg="1"/>')
        elif k == "graphicFrame":
            out.append(f'<p:bldGraphic spid="{sid}" grpId="0"><p:bldAsOne/></p:bldGraphic>')
    return f"<p:bldLst>{''.join(out)}</p:bldLst>" if out else ""


def tgt(spid): return f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'


def set_visible(nid, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'{tgt(spid)}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')


def anim_prop(nid, spid, attr, frm, to, dur):
    return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{nid()}" dur="{dur}" decel="100000" fill="hold"/>{tgt(spid)}'
            f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
            f'<p:tav tm="0"><p:val><p:strVal val="{frm}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="{to}"/></p:val></p:tav></p:tavLst></p:anim>')


def effect(nid, spid, fx, dur):
    fade = f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{nid()}" dur="{dur}"/>{tgt(spid)}</p:cBhvr></p:animEffect>'
    if fx == "fade":
        return 10, 0, set_visible(nid, spid) + fade
    if fx == "float":  # Float In
        return 42, 0, set_visible(nid, spid) + fade + anim_prop(nid, spid, "ppt_x", "#ppt_x", "#ppt_x", dur) + anim_prop(nid, spid, "ppt_y", "#ppt_y+.1", "#ppt_y", dur)
    if fx == "zoom":  # Basic Zoom (in, from centre)
        return 53, 16, set_visible(nid, spid) + anim_prop(nid, spid, "ppt_w", "#ppt_w*0.6", "#ppt_w", dur) + anim_prop(nid, spid, "ppt_h", "#ppt_h*0.6", "#ppt_h", dur) + fade
    if fx == "wipe":  # Wipe from left
        return 22, 8, set_visible(nid, spid) + f'<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="{nid()}" dur="{dur}"/>{tgt(spid)}</p:cBhvr></p:animEffect>'
    raise ValueError(fx)


def timing(items, idmap, slide_idx, kinds):
    nid = Ids()
    pars = []
    animated = []
    for it in items:
        name = it["name"]
        # objects that Morph carries across slides must not also have entrance effects
        if name.startswith("!!") and slide_idx != 0:
            continue
        spid = idmap.get(name)
        if spid is None:
            continue
        cid = nid()
        preset, sub, body = effect(nid, spid, it["fx"], it["dur"])
        animated.append(spid)
        pars.append(f'<p:par><p:cTn id="{cid}" presetID="{preset}" presetClass="entr" presetSubtype="{sub}" fill="hold" grpId="0" nodeType="withEffect">'
                    f'<p:stCondLst><p:cond delay="{it["delay"]}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')
    if not pars:
        return "", []
    xml = ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
           '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
           # one group that starts by itself as soon as the slide (and its transition) begins
           '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
           '<p:par><p:cTn id="999" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
           + "".join(pars) +
           '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>'
           '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
           '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
           '</p:childTnLst></p:cTn></p:par></p:tnLst>' + build_list(animated, kinds) + '</p:timing>')
    # give the inner group a unique id after the effects were numbered
    xml = xml.replace('id="999"', f'id="{nid()}"')
    used = [p for p in pars]
    return xml, used


zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED)
report = []
for item in zin.infolist():
    data = zin.read(item.filename)
    m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
    if m:
        i = int(m.group(1)) - 1
        s = data.decode("utf-8")
        idmap = {name: sid for sid, name in re.findall(r'<p:cNvPr id="(\d+)" name="([^"]*)"', s)}
        sp = spec[i]
        kinds = {sid: k for k, sid in re.findall(r'<p:(graphicFrame)>\s*<p:nv\w+>\s*<p:cNvPr id="(\d+)"', s)}
        for block in re.findall(r"<p:sp>.*?</p:sp>", s, re.S):  # PowerPoint lists only text-bearing shapes
            mid = re.search(r'<p:cNvPr id="(\d+)"', block)
            if mid and "<p:txBody>" in block:
                kinds[mid.group(1)] = "sp"
        tim, used = timing(sp["items"], idmap, i, kinds)
        s = s.replace("<p:sld ", f"<p:sld {MC} {P14} ", 1)
        s = s.replace("</p:sld>", transition(i, sp["advMs"], sp["transDur"]) + tim + "</p:sld>")
        data = s.encode("utf-8")
        report.append(f"slide {i+1:2}: {'fade' if i == 0 else 'morph'} {sp['transDur']}ms · auto-advance {sp['advMs'] or 'off'} · {len(used)} entrance effects")
    elif item.filename == "ppt/presProps.xml":
        s = data.decode("utf-8")
        if "<p:showPr" not in s:
            show = '<p:showPr loop="1" showNarration="1" useTimings="1"><p:present/><p:sldAll/><p:penClr><a:prstClr val="red"/></p:penClr></p:showPr>'
            if re.search(r"<p:presentationPr[^>]*/>", s):
                s = re.sub(r"(<p:presentationPr[^>]*?)\s*/>", lambda m: m.group(1) + ">" + show + "</p:presentationPr>", s, 1)
            else:
                s = re.sub(r"(<p:presentationPr[^>]*>)", lambda m: m.group(1) + show, s, 1)
        data = s.encode("utf-8")
    zout.writestr(item, data)
zout.close()
print("\n".join(report))
