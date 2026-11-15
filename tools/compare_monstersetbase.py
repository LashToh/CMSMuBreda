#!/usr/bin/env python3
"""Compare MonsterSetBase XML files between BACKUP and CURRENT (read-only)."""
import re
import os
from collections import Counter, defaultdict
from pathlib import Path

CURRENT = Path(
    r"G:\Server Breda\MuDevs Season 21 cracked\MuServer 29-09-2026\Data\Monster\MonsterSetBase"
)
BACKUP = Path(
    r"G:\Server Breda\MuDevs Season 21 cracked\MuServer Mudevs 13-08-2026 - Solo backup\Data\Monster\MonsterSetBase"
)

MAPS = [
    ("Lorencia", "000 - Lorencia.xml"),
    ("Devias", "002 - Devias.xml"),
    ("Noria", "003 - Noria.xml"),
    ("Elbeland", "051 - Elbeland.xml"),
]

SECTIONS = ("NPC", "SPOT", "MONSTER", "EVENT")
CONFIG_RE = re.compile(
    r"<Config\s+([^/>]+?)\s*/>",
    re.IGNORECASE,
)
ATTR_RE = re.compile(r'(\w+)="([^"]*)"')
COMMENT_RE = re.compile(r"<!--(.*?)-->")


def norm_val(key: str, val: str) -> str:
    if key in (
        "Class",
        "Range",
        "PositionX",
        "PositionY",
        "BeginPosX",
        "BeginPosY",
        "EndPosX",
        "EndPosY",
        "Direction",
        "Quantity",
        "Element",
    ):
        try:
            return str(int(val, 10))
        except ValueError:
            return val.strip()
    return val.strip()


def parse_attrs(attr_str: str) -> dict:
    d = {}
    for k, v in ATTR_RE.findall(attr_str):
        d[k] = norm_val(k, v)
    return d


def coord_key(section: str, attrs: dict) -> tuple:
    cls = attrs.get("Class", "?")
    if section == "NPC":
        return (section, cls, attrs.get("PositionX", ""), attrs.get("PositionY", ""))
    return (
        section,
        cls,
        attrs.get("BeginPosX", ""),
        attrs.get("BeginPosY", ""),
        attrs.get("EndPosX", ""),
        attrs.get("EndPosY", ""),
    )


def entry_fingerprint(section: str, attrs: dict) -> tuple:
    items = tuple(sorted(attrs.items()))
    return (section, items)


def extract_comment(line: str) -> str:
    m = COMMENT_RE.search(line)
    return m.group(1).strip() if m else ""


def parse_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    # Strip literal \t sequences if present (some edited files)
    text = text.replace("\\t", "\t")
    current_section = None
    entries = []  # list of dicts

    for line in text.splitlines():
        sec_m = re.search(r"<(NPC|SPOT|MONSTER|EVENT)\s*>", line, re.I)
        if sec_m:
            current_section = sec_m.group(1).upper()
            continue
        if re.search(r"</(NPC|SPOT|MONSTER|EVENT)\s*>", line, re.I):
            current_section = None
            continue
        if "<Config" not in line or line.strip().startswith("<!--"):
            continue
        if current_section is None:
            continue
        m = CONFIG_RE.search(line)
        if not m:
            continue
        attrs = parse_attrs(m.group(1))
        entries.append(
            {
                "section": current_section,
                "attrs": attrs,
                "comment": extract_comment(line),
                "raw_line": line.strip(),
            }
        )
    return {"entries": entries, "text": text}


def quantity_sum(entries, sections=("SPOT", "MONSTER")):
    total = 0
    for e in entries:
        if e["section"] not in sections:
            continue
        q = e["attrs"].get("Quantity", "1")
        try:
            total += int(q)
        except ValueError:
            total += 1
    return total


def class_counts(entries):
    c = Counter()
    for e in entries:
        c[e["attrs"].get("Class", "?")] += 1
    return c


def compare_map(name: str, filename: str):
    cur_path = CURRENT / filename
    bak_path = BACKUP / filename
    result = {
        "map": name,
        "filename": filename,
        "cur_exists": cur_path.is_file(),
        "bak_exists": bak_path.is_file(),
    }
    if not result["cur_exists"] or not result["bak_exists"]:
        return result

    result["cur_size"] = cur_path.stat().st_size
    result["bak_size"] = bak_path.stat().st_size
    result["cur_path"] = str(cur_path)
    result["bak_path"] = str(bak_path)

    cur = parse_file(cur_path)
    bak = parse_file(bak_path)
    cur_e, bak_e = cur["entries"], bak["entries"]

    result["cur_total"] = len(cur_e)
    result["bak_total"] = len(bak_e)

    for sec in SECTIONS:
        result[f"cur_{sec}"] = sum(1 for e in cur_e if e["section"] == sec)
        result[f"bak_{sec}"] = sum(1 for e in bak_e if e["section"] == sec)

    result["cur_qty"] = quantity_sum(cur_e)
    result["bak_qty"] = quantity_sum(bak_e)

    cur_cls = class_counts(cur_e)
    bak_cls = class_counts(bak_e)
    all_classes = sorted(set(cur_cls) | set(bak_cls), key=lambda x: int(x) if x.isdigit() else 999999)

    class_table = []
    for cls in all_classes:
        class_table.append((cls, bak_cls.get(cls, 0), cur_cls.get(cls, 0), cur_cls.get(cls, 0) - bak_cls.get(cls, 0)))

    result["class_table"] = class_table

    def index_by_fingerprint(entries):
        d = defaultdict(list)
        for e in entries:
            d[entry_fingerprint(e["section"], e["attrs"])].append(e)
        return d

    def index_by_coord(entries):
        d = defaultdict(list)
        for e in entries:
            d[coord_key(e["section"], e["attrs"])].append(e)
        return d

    cur_fp = index_by_fingerprint(cur_e)
    bak_fp = index_by_fingerprint(bak_e)
    cur_ck = index_by_coord(cur_e)
    bak_ck = index_by_coord(bak_e)

    only_bak = []
    only_cur = []
    for fp, items in bak_fp.items():
        if fp not in cur_fp:
            only_bak.extend(items)
    for fp, items in cur_fp.items():
        if fp not in bak_fp:
            only_cur.extend(items)

    changed_attrs = []
    moved_or_replaced = []

    common_coords = set(cur_ck.keys()) & set(bak_ck.keys())
    for ck in common_coords:
        cur_items = cur_ck[ck]
        bak_items = bak_ck[ck]
        # Match pairs when counts differ use multiset comparison
        cur_fps = [entry_fingerprint(e["section"], e["attrs"]) for e in cur_items]
        bak_fps = [entry_fingerprint(e["section"], e["attrs"]) for e in bak_items]
        cur_fp_c = Counter(cur_fps)
        bak_fp_c = Counter(bak_fps)
        for fp, cnt in bak_fp_c.items():
            diff = cnt - cur_fp_c.get(fp, 0)
            if diff > 0:
                for e in bak_items:
                    if entry_fingerprint(e["section"], e["attrs"]) == fp and diff > 0:
                        if fp in cur_fp:
                            changed_attrs.append({"backup": e, "note": "attrs differ at same Class+coords"})
                        diff -= 1
        for fp, cnt in cur_fp_c.items():
            diff = cnt - bak_fp_c.get(fp, 0)
            if diff > 0:
                for e in cur_items:
                    if entry_fingerprint(e["section"], e["attrs"]) == fp and diff > 0:
                        if fp in bak_fp:
                            changed_attrs.append({"current": e, "note": "attrs differ at same Class+coords"})
                        diff -= 1

    # Same section+class but different coords (removed from one location, added elsewhere)
    bak_by_sc = defaultdict(list)
    cur_by_sc = defaultdict(list)
    for e in bak_e:
        a = e["attrs"]
        bak_by_sc[(e["section"], a.get("Class", "?"))].append(coord_key(e["section"], a))
    for e in cur_e:
        a = e["attrs"]
        cur_by_sc[(e["section"], a.get("Class", "?"))].append(coord_key(e["section"], a))

    # Detect moved: entries only in backup coords for a class vs only in current coords
    for key in set(bak_by_sc) | set(cur_by_sc):
        b_coords = set(bak_by_sc.get(key, []))
        c_coords = set(cur_by_sc.get(key, []))
        removed_coords = b_coords - c_coords
        added_coords = c_coords - b_coords
        if removed_coords and added_coords and key[0] in ("SPOT", "MONSTER", "NPC"):
            moved_or_replaced.append(
                {
                    "section": key[0],
                    "class": key[1],
                    "removed_coords": list(removed_coords)[:5],
                    "added_coords": list(added_coords)[:5],
                    "removed_n": len(removed_coords),
                    "added_n": len(added_coords),
                }
            )

    result["only_bak"] = only_bak
    result["only_cur"] = only_cur
    result["changed_attrs"] = changed_attrs
    result["moved_hints"] = moved_or_replaced[:30]
    result["identical"] = len(only_bak) == 0 and len(only_cur) == 0

    return result


def fmt_entry(e, max_len=120):
    a = e["attrs"]
    sec = e["section"]
    if sec == "NPC":
        loc = f"X={a.get('PositionX')} Y={a.get('PositionY')}"
    else:
        loc = (
            f"B=({a.get('BeginPosX')},{a.get('BeginPosY')}) "
            f"E=({a.get('EndPosX')},{a.get('EndPosY')}) Q={a.get('Quantity','1')}"
        )
    cmt = e["comment"][:40] if e["comment"] else ""
    s = f"[{sec}] Class {a.get('Class')} {loc} R={a.get('Range','?')} {cmt}"
    return s[:max_len]


def print_report(results):
    print("=" * 100)
    print("COMPARACION MonsterSetBase - BACKUP (13-08-2026) vs CURRENT (29-09-2026)")
    print(f"BACKUP:  {BACKUP}")
    print(f"CURRENT: {CURRENT}")
    print("=" * 100)

    for r in results:
        print()
        print("#" * 80)
        print(f"## MAPA: {r['map']} ({r['filename']})")
        print("#" * 80)
        if not r.get("cur_exists") or not r.get("bak_exists"):
            print("  ERROR: Falta archivo en una de las rutas.")
            continue

        print("\n### 1) Archivos y tamaños")
        print(f"| Versión | Bytes | Ruta |")
        print(f"|---------|------:|------|")
        print(f"| BACKUP  | {r['bak_size']:,} | `{r['bak_path']}` |")
        print(f"| CURRENT | {r['cur_size']:,} | `{r['cur_path']}` |")
        delta_b = r["cur_size"] - r["bak_size"]
        print(f"| Delta tamano | {delta_b:+,} bytes | |")

        print("\n### 2) Conteo de entradas Config por sección")
        print("| Seccion | BACKUP | CURRENT | Diff |")
        print("|---------|-------:|--------:|-----:|")
        for sec in SECTIONS:
            b, c = r[f"bak_{sec}"], r[f"cur_{sec}"]
            print(f"| {sec} | {b} | {c} | {c - b:+d} |")
        print(f"| **TOTAL** | **{r['bak_total']}** | **{r['cur_total']}** | **{r['cur_total'] - r['bak_total']:+d}** |")
        print(f"| Suma Quantity (SPOT+MONSTER) | {r['bak_qty']} | {r['cur_qty']} | {r['cur_qty'] - r['bak_qty']:+d} |")

        print("\n### 3) Conteo por Class (ID monstruo/NPC)")
        print("| Class | BACKUP | CURRENT | Diff |")
        print("|-------:|-------:|--------:|-----:|")
        for cls, b, c, d in r["class_table"]:
            if b != c:
                mark = " **"
            else:
                mark = ""
            print(f"| {cls}{mark} | {b} | {c} | {d:+d} |")

        print("\n### 4) Diferencias de spots")
        print(f"- Solo en BACKUP: **{len(r['only_bak'])}** entradas")
        print(f"- Solo en CURRENT: **{len(r['only_cur'])}** entradas")
        print(f"- Idénticos (misma línea Config): **{'Sí' if r['identical'] else 'No'}**")

        if r["only_bak"]:
            print("\n**Solo BACKUP (máx. 15):**")
            for e in r["only_bak"][:15]:
                print(f"  - {fmt_entry(e)}")
            if len(r["only_bak"]) > 15:
                print(f"  ... +{len(r['only_bak']) - 15} más")

        if r["only_cur"]:
            print("\n**Solo CURRENT (máx. 15):**")
            for e in r["only_cur"][:15]:
                print(f"  - {fmt_entry(e)}")
            if len(r["only_cur"]) > 15:
                print(f"  ... +{len(r['only_cur']) - 15} más")

        if r["moved_hints"]:
            print("\n**Posibles movimientos (misma Class, coords distintas) — muestra:**")
            for m in r["moved_hints"][:8]:
                print(
                    f"  - [{m['section']}] Class {m['class']}: "
                    f"-{m['removed_n']} coords / +{m['added_n']} coords"
                )

        print("\n### 5) Resumen breve")
        total_d = r["cur_total"] - r["bak_total"]
        qty_d = r["cur_qty"] - r["bak_qty"]
        if total_d == 0 and qty_d == 0 and r["identical"]:
            dens = "Sin cambios detectables"
        elif qty_d > 0 or total_d > 0:
            dens = f"Más denso (+{total_d} spots, +{qty_d} mobs en Quantity)"
        elif qty_d < 0 or total_d < 0:
            dens = f"Más disperso ({total_d} spots, {qty_d} mobs en Quantity)"
        else:
            dens = "Misma cantidad total; cambios de composición/ubicación"

        diff_classes = [(cls, b, c, d) for cls, b, c, d in r["class_table"] if d != 0]
        if diff_classes:
            mob_note = ", ".join(
                f"Class {cls} ({b}->{c}, diff {d:+d})" for cls, b, c, d in diff_classes[:8]
            )
            if len(diff_classes) > 8:
                mob_note += f", ... (+{len(diff_classes) - 8} classes más)"
        else:
            mob_note = "Ninguna Class cambió de conteo"

        print(f"- **Densidad:** {dens}")
        print(f"- **Mobs clave (Δ Class):** {mob_note}")


def main():
    results = [compare_map(n, f) for n, f in MAPS]
    print_report(results)


if __name__ == "__main__":
    main()
