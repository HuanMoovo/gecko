# -*- coding: utf-8 -*-
"""
GECKO 品牌资产生成器 — 按参考图重绘：
圆形扇贝徽章 · 中央守宫竖瞳 · 放射状鳞片纹理 · GECKO 字标
输出: images/gecko-logo.svg / gecko-mark.svg / favicon.svg
"""
import math
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "images")
os.makedirs(OUT, exist_ok=True)

random.seed(20261001)

CX, CY = 200.0, 200.0      # 徽章圆心
R_BADGE = 150.0            # 徽章主半径
SCALLOP_N = 26             # 扇贝数量
SCALLOP_R = 13.0           # 扇贝半径
RING_R = 128.0             # 内环半径
RING_W = 7.0
EYE_W, EYE_H = 46.0, 74.0  # 眼睛（横向宽，纵向高）
TEXT_Y = 430.0


def scallop_circle() -> str:
    """外圈扇贝边：沿圆周的凸起圆"""
    parts = []
    for i in range(SCALLOP_N):
        a = 2 * math.pi * i / SCALLOP_N - math.pi / 2
        x = CX + (R_BADGE - 2) * math.cos(a)
        y = CY + (R_BADGE - 2) * math.sin(a)
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{SCALLOP_R:.1f}"/>')
    return "".join(parts)


def scale_texture() -> str:
    """放射状鳞片纹理 — 避开中央眼睛区域"""
    parts = []
    rings = [(52, 76, 18), (78, 100, 22), (102, 121, 26)]
    for r_in, r_out, n in rings:
        for i in range(n):
            a0 = 2 * math.pi * i / n + random.uniform(-0.06, 0.06)
            a1 = a0 + (2 * math.pi / n) * random.uniform(0.55, 0.92)
            # 避开中央竖眼（左右 ±0.34 rad 且内环）
            mid = (a0 + a1) / 2
            if r_in < 62 and (abs(math.sin(mid)) > 0.90):
                continue
            rin = r_in * random.uniform(0.96, 1.06)
            rout = r_out * random.uniform(0.94, 1.05)
            pts = []
            for (aa, rr) in ((a0, rin), (a1, rin), (a1 * 0.5 + a0 * 0.5 + (a1 - a0) * 0.12, rout),
                             (a0 * 0.55 + a1 * 0.45 - (a1 - a0) * 0.10, rout * 1.02), (a0, rin * 1.03)):
                x = CX + rr * math.cos(aa)
                y = CY + rr * math.sin(aa)
                pts.append(f"{x:.1f},{y:.1f}")
            pts = pts[:-1]
            parts.append(f'<polygon points="{" ".join(pts)}"/>')
    return "".join(parts)


def inner_cracks() -> str:
    """环内细裂纹线，增加手绘密度"""
    parts = []
    for i in range(26):
        a = 2 * math.pi * i / 26 + random.uniform(-0.05, 0.05)
        r1 = random.uniform(58, 72)
        r2 = r1 + random.uniform(14, 34)
        if abs(r2 * math.cos(a)) < 30 and (r1 * math.sin(a)) < 60:
            # 靠近中央眼睛的短裂纹缩短
            r2 = min(r2, r1 + 16)
        x1, y1 = CX + r1 * math.cos(a), CY + r1 * math.sin(a)
        x2, y2 = CX + r2 * math.cos(a), CY + r2 * math.sin(a)
        xm = (x1 + x2) / 2 + random.uniform(-6, 6)
        ym = (y1 + y2) / 2 + random.uniform(-6, 6)
        parts.append(f'<path d="M{x1:.1f} {y1:.1f} Q{xm:.1f} {ym:.1f} {x2:.1f} {y2:.1f}"/>')
    return "".join(parts)


def eye_group() -> str:
    """中央守宫竖瞳眼睛：杏仁形眼白轮廓 + 竖瞳 + 高光"""
    return f'''
  <g class="gecko-eye">
    <!-- 杏仁眼（外轮廓） -->
    <path d="M{CX} {CY - EYE_H * 0.72}
             C{CX + EYE_W * 0.62} {CY - EYE_H * 0.42}, {CX + EYE_W * 0.60} {CY + EYE_H * 0.40}, {CX} {CY + EYE_H * 0.78}
             C{CX - EYE_W * 0.60} {CY + EYE_H * 0.40}, {CX - EYE_W * 0.62} {CY - EYE_H * 0.42}, {CX} {CY - EYE_H * 0.72} Z
             " fill="currentColor"/>
    <!-- 高光 -->
    <ellipse cx="{CX - 9}" cy="{CY - 26}" rx="4.2" ry="8.5" fill="#fff" opacity="0.92"/>
    <ellipse cx="{CX - 6}" cy="{CY + 6}" rx="2.6" ry="5.0" fill="#fff" opacity="0.85"/>
  </g>'''


def svg_mark(stroke: str = "currentColor") -> str:
    """徽章主体（不含文字）"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="GECKO">
  <g fill="none" stroke="{stroke}" stroke-width="{RING_W}" stroke-linejoin="round" stroke-linecap="round">
    <g fill="none" stroke="{stroke}" stroke-width="5">{scallop_circle()}</g>
    <circle cx="{CX}" cy="{CY}" r="{RING_R}" stroke-width="{RING_W}"/>
    <g stroke-width="3.2" fill="none">{scale_texture()}</g>
    <g stroke-width="2.2" fill="none" opacity="0.9">{inner_cracks()}</g>
  </g>
{eye_group()}
</svg>'''


def svg_logo() -> str:
    """完整字标：徽章 + GECKO"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" role="img" aria-label="GECKO">
  <g fill="none" stroke="currentColor" stroke-width="{RING_W}" stroke-linejoin="round" stroke-linecap="round">
    <g stroke-width="5">{scallop_circle()}</g>
    <circle cx="{CX}" cy="{CY}" r="{RING_R}" stroke-width="{RING_W}"/>
    <g stroke-width="3.2">{scale_texture()}</g>
    <g stroke-width="2.2" opacity="0.9">{inner_cracks()}</g>
  </g>
{eye_group()}
  <text x="{CX}" y="{TEXT_Y}" text-anchor="middle" fill="currentColor"
        font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="600"
        font-size="56" letter-spacing="10">GECKO</text>
</svg>'''


def main() -> None:
    with open(os.path.join(OUT, "gecko-logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_logo())
    with open(os.path.join(OUT, "gecko-mark.svg"), "w", encoding="utf-8") as f:
        f.write(svg_mark())
    # favicon：小尺寸优化（简化扇贝环，聚焦眼睛）
    fav = svg_mark().replace('viewBox="0 0 400 400"', 'viewBox="24 24 352 352"')
    with open(os.path.join(OUT, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(fav)
    print("generated:", os.listdir(OUT))


if __name__ == "__main__":
    main()
