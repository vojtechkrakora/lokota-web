"""One-off print artwork; outside the application build.

Requires Python 3 and ReportLab (4.0.9 used for the original export), plus the
three macOS fonts below. Run with --url followed by the confirmed website URL.
The PDF contains vector artwork/QR and embedded Czech-capable font subsets.
"""

import argparse
from pathlib import Path
from urllib.parse import urlsplit

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path(__file__).resolve().parent / 'pozvanka-na-web-a4.pdf'
NAVY = HexColor('#13243A')
RED = HexColor('#B42332')
MUTED = HexColor('#536172')
PAPER = HexColor('#FAF7F3')
LINE = HexColor('#DED9D3')


def make_flyer(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError('Use a public HTTPS website address without credentials.')
    display_url = parsed.netloc + parsed.path.rstrip('/')
    if parsed.query or parsed.fragment:
        raise ValueError('Use the clean website URL without a query or fragment.')

    fonts = Path('/System/Library/Fonts/Supplemental')
    for name, filename in [('Display', 'DIN Condensed Bold.ttf'),
                           ('Body', 'Arial.ttf'), ('Bold', 'Arial Bold.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))

    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1, pdfVersion=(1, 4))
    c.setTitle('Hra pokračuje i na webu — KK Lokomotiva Tábor')
    c.setAuthor('KK Lokomotiva Tábor')
    c.setSubject('Pozvánka na klubový web • tisk A4 na výšku')
    c.setCreator('Klubový letáček / ReportLab')
    c.setViewerPreference('PrintScaling', 'None')
    width, height = A4
    left, right = 36, width - 36

    def text(x, y, value, font='Body', size=12, color=NAVY):
        c.setFillColor(color)
        c.setFont(font, size)
        c.drawString(x, y, value)

    def line(x1, y1, x2, y2, color=LINE, thickness=0.7):
        c.setStrokeColor(color)
        c.setLineWidth(thickness)
        c.line(x1, y1, x2, y2)

    # Generous white page margins make ordinary office printing practical.
    c.setFillColor(white)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(left, height - 39, 74, 4, fill=1, stroke=0)
    logo = ROOT / 'src/assets/club-logo.jpg'
    c.drawImage(ImageReader(str(logo)), left, 714, 69, 69)
    text(121, 757, 'KK LOKOMOTIVA TÁBOR', 'Bold', 17)
    text(121, 736, 'Váš kuželkářský klub. Také online.', size=12, color=MUTED)
    line(left, 696, right, 696)

    # Original vector illustration: nine pins in the nine-pin diamond formation.
    # It is decorative artwork, independent of the unaltered official emblem.
    def pin(x, y, scale=1):
        c.saveState()
        c.translate(x, y)
        c.scale(scale, scale)
        p = c.beginPath()
        p.moveTo(-4, 0)
        p.curveTo(-8, 6, -8, 13, -5, 20)
        p.curveTo(-2, 26, -2, 29, -4, 33)
        p.curveTo(-7, 40, -4, 46, 0, 46)
        p.curveTo(4, 46, 7, 40, 4, 33)
        p.curveTo(2, 29, 2, 26, 5, 20)
        p.curveTo(8, 13, 8, 6, 4, 0)
        p.close()
        c.setFillColor(NAVY)
        c.drawPath(p, fill=1, stroke=0)
        c.setFillColor(RED)
        c.rect(-2.3, 28, 4.6, 3, fill=1, stroke=0)
        c.restoreState()

    # Back-to-front order preserves the diamond, with nine separate silhouettes.
    for row, count in enumerate([1, 2, 3, 2, 1]):
        for col in range(count):
            pin(470 + (col - (count - 1) / 2) * 27, 643 - row * 15, 0.70)
    c.setFillColor(RED)
    c.circle(489, 566, 16, fill=1, stroke=0)
    line(474, 546, 452, 529, RED, 1.5)
    line(483, 544, 461, 527, RED, 1.5)

    text(left - 2, 611, 'HRA', 'Display', 112)
    text(left - 2, 519, 'POKRAČUJE', 'Display', 112)
    text(left - 2, 427, 'I NA WEBU.', 'Display', 112, RED)
    text(left, 395, 'Z kuželny rovnou do mobilu.', 'Bold', 18)

    # Four concrete reasons to visit; no promise of live scoring or daily updates.
    features = [
        (left, 350, '01', 'Výsledky a tabulky', 'Jak si vedou naše družstva.'),
        (310, 350, '02', 'Nejbližší zápasy', 'Kdy a s kým hrajeme příště.'),
        (left, 301, '03', 'Novinky z klubu', 'Reportáže a dění na drahách.'),
        (310, 301, '04', 'Žižkova 200', 'Turnaj a výsledky ročníků.'),
    ]
    for x, y, number, heading, detail in features:
        text(x, y, number, 'Display', 17, RED)
        text(x + 26, y, heading, 'Bold', 13)
        text(x + 26, y - 17, detail, size=10.5, color=MUTED)

    # Black vector QR on plain white with four full quiet-zone modules.
    c.setFillColor(PAPER)
    c.roundRect(left, 65, right - left, 193, 10, fill=1, stroke=0)
    text(53, 233, 'MĚJTE KLUB NA DOSAH', 'Bold', 10, RED)
    text(53, 196, 'Namiřte foťák.', 'Bold', 24)
    text(53, 166, 'Otevřete náš web.', 'Bold', 24)
    text(53, 139, 'Stačí načíst QR kód telefonem.', size=11, color=MUTED)
    address_size = min(17, 285 / pdfmetrics.stringWidth(display_url, 'Bold', 1))
    text(53, 96, display_url, 'Bold', address_size)
    c.linkURL(url, (53, 90, 338, 119), relative=0, thickness=0)

    qr_size = 160  # 56.4 mm including quiet zone, well above typical print minima.
    qr_x, qr_y = right - qr_size - 15, 81
    qr = QrCodeWidget(url, barLevel='M', barBorder=4)
    bounds = qr.getBounds()
    qr_width, qr_height = bounds[2] - bounds[0], bounds[3] - bounds[1]
    drawing = Drawing(qr_size, qr_size,
                      transform=[qr_size / qr_width, 0, 0, qr_size / qr_height, 0, 0])
    drawing.add(qr)
    c.setFillColor(white)
    c.rect(qr_x, qr_y, qr_size, qr_size, fill=1, stroke=0)
    renderPDF.draw(drawing, c, qr_x, qr_y)
    c.linkURL(url, (qr_x, qr_y, qr_x + qr_size, qr_y + qr_size), relative=0, thickness=0)

    c.setFillColor(NAVY)
    c.setFont('Bold', 11)
    c.drawCentredString(width / 2, 37, 'Fanděte s námi. I mezi zápasy.')
    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True, help='Confirmed public website HTTPS URL')
    make_flyer(parser.parse_args().url)
