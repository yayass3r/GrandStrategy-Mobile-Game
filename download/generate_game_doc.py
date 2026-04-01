import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ==================== Font Registration ====================
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ==================== Colors ====================
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = colors.HexColor('#F5F5F5')
ACCENT_COLOR = colors.HexColor('#2E86AB')
DARK_BG = colors.HexColor('#0D1B2A')

# ==================== Styles ====================
cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='SimHei',
    fontSize=36,
    leading=48,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1F4E79'),
    spaceAfter=20,
    wordWrap='CJK'
)

cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=18,
    leading=26,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#2E86AB'),
    spaceAfter=12,
    wordWrap='CJK'
)

cover_info_style = ParagraphStyle(
    name='CoverInfo',
    fontName='SimHei',
    fontSize=13,
    leading=20,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#555555'),
    spaceAfter=10,
    wordWrap='CJK'
)

h1_style = ParagraphStyle(
    name='H1',
    fontName='SimHei',
    fontSize=20,
    leading=28,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=18,
    spaceAfter=10,
    wordWrap='CJK'
)

h2_style = ParagraphStyle(
    name='H2',
    fontName='SimHei',
    fontSize=15,
    leading=22,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#2E86AB'),
    spaceBefore=14,
    spaceAfter=8,
    wordWrap='CJK'
)

h3_style = ParagraphStyle(
    name='H3',
    fontName='SimHei',
    fontSize=12,
    leading=18,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#333333'),
    spaceBefore=10,
    spaceAfter=6,
    wordWrap='CJK'
)

body_style = ParagraphStyle(
    name='Body',
    fontName='SimHei',
    fontSize=10.5,
    leading=18,
    alignment=TA_LEFT,
    textColor=colors.black,
    firstLineIndent=21,
    spaceAfter=6,
    wordWrap='CJK'
)

body_no_indent = ParagraphStyle(
    name='BodyNoIndent',
    fontName='SimHei',
    fontSize=10.5,
    leading=18,
    alignment=TA_LEFT,
    textColor=colors.black,
    spaceAfter=6,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    name='Code',
    fontName='SarasaMonoSC',
    fontSize=8.5,
    leading=13,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#2E2E2E'),
    backColor=colors.HexColor('#F8F8F8'),
    leftIndent=12,
    rightIndent=12,
    spaceBefore=4,
    spaceAfter=4,
    wordWrap='CJK'
)

bullet_style = ParagraphStyle(
    name='Bullet',
    fontName='SimHei',
    fontSize=10.5,
    leading=18,
    alignment=TA_LEFT,
    textColor=colors.black,
    leftIndent=24,
    bulletIndent=12,
    spaceAfter=4,
    wordWrap='CJK'
)

tbl_header_style = ParagraphStyle(
    name='TblHeader',
    fontName='SimHei',
    fontSize=10,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.white,
    wordWrap='CJK'
)

tbl_cell_style = ParagraphStyle(
    name='TblCell',
    fontName='SimHei',
    fontSize=9.5,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.black,
    wordWrap='CJK'
)

tbl_cell_left = ParagraphStyle(
    name='TblCellLeft',
    fontName='SimHei',
    fontSize=9.5,
    leading=14,
    alignment=TA_LEFT,
    textColor=colors.black,
    wordWrap='CJK'
)

caption_style = ParagraphStyle(
    name='Caption',
    fontName='SimHei',
    fontSize=9,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666'),
    spaceBefore=3,
    spaceAfter=6,
    wordWrap='CJK'
)

# ==================== Document Setup ====================
output_path = '/home/z/my-project/download/GrandStrategy_Game_Documentation.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    title='GrandStrategy_Game_Documentation',
    author='Z.ai',
    creator='Z.ai',
    subject='4X Grand Strategy Game - Technical Design Document',
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

story = []

# ==================== COVER PAGE ====================
story.append(Spacer(1, 80))

# Decorative line
cover_line_data = [['']]
cover_line = Table(cover_line_data, colWidths=[doc.width])
cover_line.setStyle(TableStyle([
    ('LINEABOVE', (0, 0), (-1, 0), 3, colors.HexColor('#1F4E79')),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
]))
story.append(cover_line)
story.append(Spacer(1, 30))

story.append(Paragraph('<b>4X Grand Strategy Game</b>', cover_title_style))
story.append(Spacer(1, 16))
story.append(Paragraph('<b>Technical Design Document</b>', cover_subtitle_style))
story.append(Spacer(1, 10))
story.append(Paragraph('Mobile Game - Android Platform', cover_subtitle_style))

story.append(Spacer(1, 50))

cover_line2 = Table(cover_line_data, colWidths=[doc.width * 0.5])
cover_line2.setStyle(TableStyle([
    ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#2E86AB')),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(cover_line2)
story.append(Spacer(1, 30))

story.append(Paragraph('Engine: Unity (C#)', cover_info_style))
story.append(Paragraph('Platform: Android (Mobile)', cover_info_style))
story.append(Paragraph('Genre: 4X Grand Strategy', cover_info_style))
story.append(Spacer(1, 20))
story.append(Paragraph('Phase 1: Core Systems', cover_info_style))
story.append(Paragraph('Camera Controls + Population System + Governor AI + Loyalty System', cover_info_style))
story.append(Spacer(1, 60))

story.append(Paragraph('2026', cover_info_style))
story.append(PageBreak())

# ==================== TABLE OF CONTENTS ====================
story.append(Paragraph('<b>Table of Contents</b>', h1_style))
story.append(Spacer(1, 12))

toc_entries = [
    ('1. System Overview', ''),
    ('    1.1 Game Vision', ''),
    ('    1.2 Architecture Overview', ''),
    ('    1.3 File Structure', ''),
    ('2. Mobile Camera Touch Controls', ''),
    ('    2.1 Drag to Pan', ''),
    ('    2.2 Pinch to Zoom', ''),
    ('    2.3 Tap to Select', ''),
    ('    2.4 Key Classes and Events', ''),
    ('3. Population System', ''),
    ('    3.1 Population Demographics', ''),
    ('    3.2 Labor Distribution', ''),
    ('    3.3 Population Growth', ''),
    ('    3.4 Conscription System', ''),
    ('    3.5 Production Calculation', ''),
    ('4. Governor AI System', ''),
    ('    4.1 Governor Types', ''),
    ('    4.2 Economic Governor AI', ''),
    ('    4.3 Military Governor AI', ''),
    ('    4.4 Defensive Governor AI', ''),
    ('    4.5 Trait System', ''),
    ('5. Loyalty and Traits System', ''),
    ('    5.1 Loyalty Mechanics', ''),
    ('    5.2 Rebellion System', ''),
    ('    5.3 Trait Effects on Loyalty', ''),
    ('6. Supreme Commander (Player Controller)', ''),
    ('    6.1 Player Commands', ''),
    ('    6.2 Budget Management', ''),
    ('    6.3 Notification System', ''),
]

for entry, _ in toc_entries:
    is_main = not entry.startswith('    ')
    st = ParagraphStyle(
        name=f'toc_{entry.strip()}',
        fontName='SimHei',
        fontSize=11 if is_main else 10,
        leading=18 if is_main else 16,
        leftIndent=0 if is_main else 20,
        textColor=colors.HexColor('#1F4E79') if is_main else colors.HexColor('#333333'),
        spaceAfter=3,
        wordWrap='CJK'
    )
    text = entry.strip()
    if is_main:
        text = '<b>' + text + '</b>'
    story.append(Paragraph(text, st))

story.append(PageBreak())

# ==================== 1. SYSTEM OVERVIEW ====================
story.append(Paragraph('<b>1. System Overview</b>', h1_style))

story.append(Paragraph('<b>1.1 Game Vision</b>', h2_style))
story.append(Paragraph(
    'The game is a 4X Grand Strategy title built specifically for mobile platforms, running on the Android operating system. '
    'The core design philosophy centers on putting the player in the role of the Supreme Commander who makes high-level strategic '
    'decisions rather than micromanaging individual cities. Instead of manually placing buildings or adjusting granular resource '
    'sliders, the player appoints AI-driven governors to autonomously manage conquered cities. Each governor type brings a unique '
    'strategic flavor, allowing the player to focus on army movements, tax policy, and grand strategy while the governors handle '
    'day-to-day city operations. This approach is ideal for mobile gameplay where touch controls and shorter play sessions demand '
    'streamlined decision-making with meaningful impact.',
    body_style
))
story.append(Paragraph(
    'The mobile-first design philosophy means that every system, from the camera controls to the notification system, has been '
    'architected with touch input as the primary interaction method. The user interface uses large, clearly labeled buttons, '
    'dropdown menus for budget allocation, and a notification popup system for receiving governor reports. Performance optimization '
    'techniques such as Object Pooling and Level of Detail (LOD) are employed to maintain a stable frame rate and prevent battery '
    'drain on mobile devices. Data persistence is handled through a combination of local storage (JSON files) and optional cloud '
    'save support, ensuring that progress is never lost even on devices with limited connectivity.',
    body_style
))

story.append(Paragraph('<b>1.2 Architecture Overview</b>', h2_style))
story.append(Paragraph(
    'The codebase follows a modular, event-driven architecture that separates concerns into distinct systems. Each major game '
    'mechanic is encapsulated within its own namespace and set of classes, communicating with other systems through C# events '
    'and delegates rather than tight coupling. This design pattern allows individual systems to be developed, tested, and modified '
    'independently. The Population Manager, Governor AI, Loyalty System, and Player Controller each operate as self-contained '
    'modules that subscribe to and publish events. For example, when a governor makes a decision to recruit soldiers, the '
    'Population Manager publishes an event that the Loyalty System can react to, creating a chain of consequences that feels '
    'organic and interconnected without requiring explicit method calls between unrelated classes.',
    body_style
))
story.append(Paragraph(
    'The architecture also employs a turn-based update cycle where all systems synchronize their state at the beginning of each '
    'turn. The Supreme Commander orchestrates this cycle by calling OnTurnUpdate on each subsystem in a specific order: first '
    'the governors make their decisions, then the population grows, then loyalty is recalculated, and finally the budget is '
    'updated. This deterministic update order prevents race conditions and makes the simulation predictable and debuggable. The '
    'system is designed to support both hot-seat multiplayer and AI opponents in future development phases, with the current '
    'implementation focused on single-player against AI-controlled factions.',
    body_style
))

story.append(Paragraph('<b>1.3 File Structure</b>', h2_style))
story.append(Spacer(1, 6))

file_data = [
    [Paragraph('<b>File Name</b>', tbl_header_style),
     Paragraph('<b>Namespace</b>', tbl_header_style),
     Paragraph('<b>Description</b>', tbl_header_style)],
    [Paragraph('MobileCameraController.cs', tbl_cell_left),
     Paragraph('CameraSystem', tbl_cell_style),
     Paragraph('Touch-based camera: Drag, Pinch-Zoom, Tap', tbl_cell_left)],
    [Paragraph('PopulationData.cs', tbl_cell_left),
     Paragraph('PopulationSystem', tbl_cell_style),
     Paragraph('Enums, Structs, and Data Classes', tbl_cell_left)],
    [Paragraph('PopulationManager.cs', tbl_cell_left),
     Paragraph('PopulationSystem', tbl_cell_style),
     Paragraph('Core population management logic', tbl_cell_left)],
    [Paragraph('GovernorAI.cs', tbl_cell_left),
     Paragraph('GovernorSystem', tbl_cell_style),
     Paragraph('AI Governors + Factory + Traits', tbl_cell_left)],
    [Paragraph('LoyaltySystem.cs', tbl_cell_left),
     Paragraph('LoyaltySystem', tbl_cell_style),
     Paragraph('Loyalty, Rebellion, Event Effects', tbl_cell_left)],
    [Paragraph('PlayerController.cs', tbl_cell_left),
     Paragraph('PlayerSystem', tbl_cell_style),
     Paragraph('Supreme Commander commands', tbl_cell_left)],
    [Paragraph('CityResourceManager.cs', tbl_cell_left),
     Paragraph('GrandStrategyGame', tbl_cell_style),
     Paragraph('City resource management', tbl_cell_left)],
]

file_table = Table(file_data, colWidths=[4.2*cm, 3.2*cm, 8.0*cm])
file_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(file_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 1: Project File Structure', caption_style))
story.append(Spacer(1, 18))

# ==================== 2. MOBILE CAMERA TOUCH CONTROLS ====================
story.append(Paragraph('<b>2. Mobile Camera Touch Controls</b>', h1_style))

story.append(Paragraph(
    'The Mobile Camera Controller is the first system a player interacts with and serves as the foundation for all map-based '
    'interaction. Designed specifically for Android touch screens, it supports three primary gestures: single-finger drag for '
    'panning across the world map, two-finger pinch for zooming in and out, and single tap for selecting cities, armies, and '
    'other interactive objects. The system is built on Unity Input.touchCount API and handles multi-touch scenarios gracefully, '
    'including transitions between single and dual touch states without losing tracking context. All camera movement uses '
    'SmoothDamp interpolation to ensure buttery-smooth transitions that feel natural on mobile devices, avoiding the jarring '
    'snapping that can occur with direct position assignment.',
    body_style
))

story.append(Paragraph('<b>2.1 Drag to Pan</b>', h2_style))
story.append(Paragraph(
    'The drag mechanic works by casting a ray from the touch position onto the ground plane using a Physics.Raycast call. The '
    'world-space delta between the current touch position and the previous touch position is calculated and applied to the '
    'camera target position. This approach ensures that panning speed remains consistent regardless of zoom level, as the '
    'world-space movement naturally accounts for the current camera perspective. The system includes a configurable drag speed '
    'multiplier that allows designers to fine-tune the feel of the panning. Additionally, the camera position is clamped to '
    'stay within the defined map boundaries, with the boundary padding dynamically adjusting based on the current zoom level '
    'to prevent the player from seeing beyond the edge of the playable area.',
    body_style
))

story.append(Paragraph('<b>2.2 Pinch to Zoom</b>', h2_style))
story.append(Paragraph(
    'Pinch-to-zoom detects when two touches are active on the screen simultaneously. The system measures the distance between '
    'the two touch points and compares it to the initial pinch distance recorded when the second finger first touched the screen. '
    'The difference between these distances is converted into a zoom change value and applied to the camera target zoom. Both '
    'orthographic and perspective camera modes are supported: for orthographic cameras, the zoom value maps to the orthographic '
    'size, while for perspective cameras, it maps to the field of view. The zoom range is constrained between configurable '
    'minimum and maximum values, with the smooth zoom transition handled by Mathf.SmoothDamp to provide a fluid, responsive feel '
    'that matches the quality expectations of modern mobile games. The zoom speed parameter can be adjusted in the Unity Inspector '
    'to achieve the desired sensitivity for different device screen sizes and player preferences.',
    body_style
))

story.append(Paragraph('<b>2.3 Tap to Select</b>', h2_style))
story.append(Paragraph(
    'The tap detection system differentiates between an intentional tap and an accidental touch by monitoring two criteria: the '
    'total distance the finger moved during the touch, and the total duration of the touch. If the finger moves less than 15 '
    'pixels and the touch lasts less than 0.3 seconds, the system registers it as a tap. Upon detecting a tap, the system '
    'casts a ray into the scene and first checks for objects implementing the ISelectable interface. If a selectable object is '
    'found (such as a city or army), its OnSelected method is called and the OnSelectableTapped event is fired. If no selectable '
    'object is hit but the ray intersects the ground plane, the OnMapTapped event is fired with the world position of the tap, '
    'which can be used for army movement commands or other map interactions. This layered approach ensures that taps on interactive '
    'objects take priority over general map taps, providing intuitive and predictable selection behavior.',
    body_style
))

story.append(Paragraph('<b>2.4 Key Classes and Events</b>', h2_style))
story.append(Spacer(1, 6))

events_data = [
    [Paragraph('<b>Event Name</b>', tbl_header_style),
     Paragraph('<b>Parameters</b>', tbl_header_style),
     Paragraph('<b>Trigger</b>', tbl_header_style)],
    [Paragraph('OnMapTapped', tbl_cell_left),
     Paragraph('Vector3 position', tbl_cell_style),
     Paragraph('Tap on ground plane', tbl_cell_left)],
    [Paragraph('OnSelectableTapped', tbl_cell_left),
     Paragraph('GameObject obj', tbl_cell_style),
     Paragraph('Tap on ISelectable object', tbl_cell_left)],
    [Paragraph('OnDragStarted', tbl_cell_left),
     Paragraph('None', tbl_cell_style),
     Paragraph('Finger drag begins', tbl_cell_left)],
    [Paragraph('OnDragEnded', tbl_cell_left),
     Paragraph('None', tbl_cell_style),
     Paragraph('Finger drag ends', tbl_cell_left)],
    [Paragraph('MoveToPosition()', tbl_cell_left),
     Paragraph('Vector3, float?', tbl_cell_style),
     Paragraph('Programmatic camera move', tbl_cell_left)],
    [Paragraph('FocusOnCity()', tbl_cell_left),
     Paragraph('Vector3 cityPos', tbl_cell_style),
     Paragraph('Center on a city', tbl_cell_left)],
    [Paragraph('ShowFullMap()', tbl_cell_left),
     Paragraph('None', tbl_cell_style),
     Paragraph('Zoom to maximum extent', tbl_cell_left)],
]

events_table = Table(events_data, colWidths=[3.8*cm, 3.5*cm, 8.1*cm])
events_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(events_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 2: Camera Controller Events and Methods', caption_style))
story.append(Spacer(1, 18))

# ==================== 3. POPULATION SYSTEM ====================
story.append(Paragraph('<b>3. Population System</b>', h1_style))

story.append(Paragraph(
    'The Population System is one of the most critical simulation layers in the game, governing how cities grow, how labor is '
    'distributed across economic sectors, and how the balance between civilian and military populations creates strategic '
    'tension. Unlike traditional 4X games where population is a single number, this system breaks down the population into '
    'age demographics (children, adults, elderly) and tracks each group independently. Only adults can be assigned to labor '
    'sectors or recruited as soldiers, creating meaningful trade-offs. Children grow into adults over time, providing a natural '
    'population growth pipeline that is influenced by food availability, happiness levels, and the dependency ratio. The elderly '
    'consume resources without contributing labor, adding realistic economic pressure that the player and AI governors must manage.',
    body_style
))

story.append(Paragraph('<b>3.1 Population Demographics</b>', h2_style))
story.append(Paragraph(
    'The PopulationDemographics struct divides the population into three age groups: children (ages 0-14), adults (ages 15-64), '
    'and elderly (ages 65+). The initial population distribution follows a realistic ratio of 30% children, 60% adults, and 10% '
    'elderly, which mirrors the demographic profile of a pre-industrial society. New population growth is distributed as 70% '
    'children, 25% young adults, and 5% elderly, reflecting natural birth and aging patterns. The dependency ratio, calculated '
    'as (children + elderly) / adults, serves as a key economic indicator. A high dependency ratio means fewer workers supporting '
    'more dependents, which increases the food consumption burden and slows economic growth. This ratio becomes a critical factor '
    'when the military conscripts large numbers of adults, effectively reducing the workforce and potentially creating a crisis if '
    'the remaining workers cannot produce enough food and gold to sustain the city.',
    body_style
))

story.append(Paragraph('<b>3.2 Labor Distribution</b>', h2_style))
story.append(Paragraph(
    'The LaborDistribution struct tracks how adult population is allocated across seven productive sectors: Farming (food), '
    'Commerce (gold), Industry (production), Construction (building speed), Mining (materials), Religion (happiness), and '
    'Research (technology). Each sector produces its designated resource at a per-worker rate that is modified by the population '
    'happiness status and governor traits. The system supports both granular worker assignment (AssignWorkers, TransferWorkers, '
    'DismissWorkers) and bulk redistribution (RedistributeLabor), with the latter being the primary interface used by AI '
    'governors. When workers are reassigned, the OnLaborDistributionChanged event is fired, allowing the UI and other systems '
    'to react accordingly. Unemployed workers are tracked separately and serve as the primary pool for military recruitment, '
    'meaning that cities with high unemployment can raise armies quickly but at the cost of idle labor that could have been '
    'contributing to the economy.',
    body_style
))

story.append(Paragraph('<b>3.3 Population Growth</b>', h2_style))
story.append(Paragraph(
    'Population growth operates on a per-turn cycle and is calculated using a multi-factor formula. The base growth rate is '
    'set at 2% per turn, which is then modified by three primary factors: happiness bonus (up to +1% when happiness exceeds 60), '
    'food surplus bonus (up to +1.5% when food per capita exceeds 0.5), and food deficit penalty (up to -5% when food is '
    'negative). Additional modifiers include population status penalties for discontent (-1%), angry (-3%), and desperate (-5%) '
    'cities, as well as a dependency ratio pressure modifier that reduces growth when there are too many dependents per worker. '
    'The final growth rate is clamped between a minimum of -3% and a maximum of +10%, ensuring that cities cannot grow too fast '
    'or collapse too quickly. When the effective growth rate is negative but greater than -1, a growth progress accumulator '
    'tracks the deficit, and only when it crosses -1 does the city actually lose a population point, creating a gradual decline '
    'rather than sudden crashes.',
    body_style
))

story.append(Paragraph('<b>3.4 Conscription System</b>', h2_style))
story.append(Paragraph(
    'The recruitment system converts civilian adults into soldiers, creating the fundamental strategic tension between economic '
    'growth and military power. When RecruitSoldiers is called, the system first pulls from the unemployed pool, then if more '
    'soldiers are needed, it draws from active workers in a prioritized order: 25% from Construction, 20% from Mining, 30% '
    'from Farming, 15% from Industry, and 10% from Commerce. This priority order is designed to protect the most critical '
    'economic sectors first: commerce (gold income) is the least affected, while construction workers are the most expendable '
    'since building projects can be paused. Each recruited soldier reduces happiness by 0.5 points, reflecting the social '
    'impact of conscription. The system enforces a military population cap per city (configurable, default 500) to prevent '
    'the unrealistic scenario of a city converting its entire population into soldiers. The RecruitmentResult struct provides '
    'detailed feedback on how many soldiers were recruited, how many came from the unemployed pool versus active workers, and '
    'the reason if recruitment failed.',
    body_style
))

story.append(Paragraph('<b>3.5 Production Calculation</b>', h2_style))
story.append(Spacer(1, 6))

prod_data = [
    [Paragraph('<b>Sector</b>', tbl_header_style),
     Paragraph('<b>Resource</b>', tbl_header_style),
     Paragraph('<b>Per Worker Rate</b>', tbl_header_style),
     Paragraph('<b>Productivity Modifier</b>', tbl_header_style)],
    [Paragraph('Farming', tbl_cell_style),
     Paragraph('Food', tbl_cell_style),
     Paragraph('2.0', tbl_cell_style),
     Paragraph('x1.3 / x1.15 / x1.0 / x0.8 / x0.6 / x0.4', tbl_cell_style)],
    [Paragraph('Commerce', tbl_cell_style),
     Paragraph('Gold', tbl_cell_style),
     Paragraph('1.5', tbl_cell_style),
     Paragraph('Same as above (based on status)', tbl_cell_style)],
    [Paragraph('Construction', tbl_cell_style),
     Paragraph('Production', tbl_cell_style),
     Paragraph('1.0', tbl_cell_style),
     Paragraph('Same as above (based on status)', tbl_cell_style)],
    [Paragraph('Mining', tbl_cell_style),
     Paragraph('Materials', tbl_cell_style),
     Paragraph('1.0', tbl_cell_style),
     Paragraph('Same as above (based on status)', tbl_cell_style)],
    [Paragraph('Research', tbl_cell_style),
     Paragraph('Research', tbl_cell_style),
     Paragraph('0.5', tbl_cell_style),
     Paragraph('Same as above (based on status)', tbl_cell_style)],
    [Paragraph('Religion', tbl_cell_style),
     Paragraph('Happiness', tbl_cell_style),
     Paragraph('0.3', tbl_cell_style),
     Paragraph('Not affected by status', tbl_cell_style)],
]

prod_table = Table(prod_data, colWidths=[2.5*cm, 2.5*cm, 3.5*cm, 6.9*cm])
prod_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(prod_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 3: Production Rates by Sector and Population Status', caption_style))
story.append(Spacer(1, 18))

# ==================== 4. GOVERNOR AI SYSTEM ====================
story.append(Paragraph('<b>4. Governor AI System</b>', h1_style))

story.append(Paragraph(
    'The Governor AI System is the defining feature that sets this game apart from traditional 4X titles. Instead of the player '
    'managing every aspect of each city, AI governors handle the day-to-day operations autonomously. The player only needs to '
    'choose which type of governor to assign to each city, and the governor takes care of labor allocation, recruitment decisions, '
    'and resource management. The system uses an abstract base class (BaseGovernorAI) with three concrete implementations '
    '(EconomicGovernorAI, MilitaryGovernorAI, DefensiveGovernorAI), each following a Evaluate-S-Decide-Execute pattern that runs '
    'every turn. The Governor Factory handles the creation of new governors with randomized names and traits, ensuring that no '
    'two governors feel exactly alike. This design creates emergent gameplay where the player must consider not just the type of '
    'governor but also their individual traits when making assignment decisions.',
    body_style
))

story.append(Paragraph('<b>4.1 Governor Types</b>', h2_style))
story.append(Spacer(1, 6))

gov_data = [
    [Paragraph('<b>Type</b>', tbl_header_style),
     Paragraph('<b>Focus</b>', tbl_header_style),
     Paragraph('<b>Labor Priority</b>', tbl_header_style),
     Paragraph('<b>Recruit Rate</b>', tbl_header_style)],
    [Paragraph('Economic', tbl_cell_style),
     Paragraph('Trade, Growth', tbl_cell_left),
     Paragraph('Commerce > Farming > Religion > Industry', tbl_cell_left),
     Paragraph('5% of unemployed', tbl_cell_style)],
    [Paragraph('Military', tbl_cell_style),
     Paragraph('Army, War', tbl_cell_left),
     Paragraph('Industry > Construction > Mining > Farming', tbl_cell_left),
     Paragraph('30-60% of unemployed', tbl_cell_style)],
    [Paragraph('Defensive', tbl_cell_style),
     Paragraph('Fortify, Stockpile', tbl_cell_left),
     Paragraph('Farming > Construction > Mining > Religion', tbl_cell_left),
     Paragraph('5-15% of unemployed', tbl_cell_style)],
]

gov_table = Table(gov_data, colWidths=[2.5*cm, 3.0*cm, 6.5*cm, 3.4*cm])
gov_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(gov_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 4: Governor Type Comparison', caption_style))
story.append(Spacer(1, 18))

story.append(Paragraph('<b>4.2 Economic Governor AI</b>', h2_style))
story.append(Paragraph(
    'The Economic Governor prioritizes trade income and population growth above all else. Under normal conditions, it assigns '
    'the highest labor weight to Commerce (4.0 base + competence bonus), followed by Farming (3.0) to ensure food self-sufficiency, '
    'and Religion (1.0-2.0) scaled dynamically based on current happiness levels. If happiness drops below 60, the Religion weight '
    'increases to 2.0 to bring more priests online and stabilize morale. The governor keeps military recruitment to a minimal 5% '
    'of unemployed workers, reflecting its philosophy that a strong economy is the foundation of long-term power. During a food '
    'crisis (food net below zero), the governor immediately shifts to emergency mode, boosting Farming weight to 5.0 while reducing '
    'all other sectors, ensuring that starvation is resolved before any other priorities are addressed. This adaptive behavior makes '
    'the Economic Governor resilient but potentially vulnerable to military threats due to its small garrison.',
    body_style
))

story.append(Paragraph('<b>4.3 Military Governor AI</b>', h2_style))
story.append(Paragraph(
    'The Military Governor is designed for cities near hostile borders or cities that the player intends to use as military '
    'production centers. It assigns the highest weight to Industry (4.0 + competence bonus) for weapons and equipment, followed '
    'by Construction (3.0) for barracks and military buildings, and Mining (2.5) for raw materials. Farming receives only 1.5 '
    'weight under normal conditions (raised to 3.0 during food crises), which means military cities may need food imports from '
    'economic cities. The recruitment rate is aggressive at 30% under normal conditions and jumps to 60% when the governor is in '
    '"Preparing Attack" mode, which triggers when the soldier-to-population ratio exceeds 15%. The Reckless trait can push this '
    'even higher by up to 50%, potentially crippling the local economy in pursuit of military might. The Military Governor '
    'periodically requests additional gold and materials from the Supreme Commander when preparing for attacks, creating a '
    'resource drain that the player must budget for.',
    body_style
))

story.append(Paragraph('<b>4.4 Defensive Governor AI</b>', h2_style))
story.append(Paragraph(
    'The Defensive Governor focuses on making cities resilient to sieges and raids. Its primary concern is food stockpiling, '
    'assigning Farming a weight of 3.5 to build reserves for extended sieges. Construction receives 3.0 for building walls and '
    'fortifications, while Mining (2.0) provides materials for defensive structures. The governor dynamically adjusts these '
    'weights based on "siege readiness" metrics: if food reserves are low (below 30% readiness), farming weight increases by '
    '2.0; if defenses are already strong (above 80%), the extra weight shifts to construction for further fortification. '
    'Military recruitment is moderate at 5-15%, enough to maintain a garrison but not so much as to weaken the economy. The '
    'Defensive Governor rarely requests resources from the central treasury, making it the most self-sufficient governor type. '
    'Cities managed by Defensive Governors are ideal as rear-line provinces that can weather enemy attacks while the military '
    'governors focus on the front lines.',
    body_style
))

story.append(Paragraph('<b>4.5 Trait System</b>', h2_style))
story.append(Paragraph(
    'Each governor is generated with 1-3 random traits from a pool of 20 possible traits, divided into positive, negative, and '
    'neutral categories. The factory guarantees at least one positive trait per governor. Traits have a magnitude value between '
    '0.5 and 1.5 that scales their effect, so a "Charismatic" governor with 1.5 magnitude provides a 22.5% happiness boost '
    'while one with 0.5 magnitude provides only 7.5%. This magnitude system adds depth to the governor assignment decision, as '
    'the player must weigh not just the presence of traits but their strength. Some traits interact with governor type: a '
    '"Reckless" trait on a Military Governor is dangerous but powerful, while a "Lazy" trait on a Defensive Governor can be '
    'disastrous if the city faces imminent attack. The governor generation system uses a 70/30 split where 70% of traits are '
    'drawn from a pool appropriate to the governor type (e.g., economic traits for Economic Governors) and 30% from the general '
    'pool, creating thematic consistency while allowing for surprising combinations.',
    body_style
))
story.append(Spacer(1, 6))

trait_data = [
    [Paragraph('<b>Trait</b>', tbl_header_style),
     Paragraph('<b>Type</b>', tbl_header_style),
     Paragraph('<b>Effect</b>', tbl_header_style)],
    [Paragraph('Charismatic', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('+15% happiness', tbl_cell_left)],
    [Paragraph('Brilliant', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('+10% production', tbl_cell_left)],
    [Paragraph('Frugal', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('-10% consumption', tbl_cell_left)],
    [Paragraph('Inspiring', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('+20% loyalty', tbl_cell_left)],
    [Paragraph('Energetic', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('+25% build speed', tbl_cell_left)],
    [Paragraph('Experienced', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('+15% competence', tbl_cell_left)],
    [Paragraph('Loyal', tbl_cell_style), Paragraph('Positive', tbl_cell_style), Paragraph('Loyalty floor 50%', tbl_cell_left)],
    [Paragraph('Corrupt', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('-20% gold income', tbl_cell_left)],
    [Paragraph('Cruel', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('-15% happiness', tbl_cell_left)],
    [Paragraph('Lazy', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('-20% build speed', tbl_cell_left)],
    [Paragraph('Reckless', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('+50% recruitment', tbl_cell_left)],
    [Paragraph('Cowardly', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('-30% recruitment', tbl_cell_left)],
    [Paragraph('Incompetent', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('-15% competence', tbl_cell_left)],
    [Paragraph('Ambitious', tbl_cell_style), Paragraph('Negative', tbl_cell_style), Paragraph('Loyalty decay over time', tbl_cell_left)],
]

trait_table = Table(trait_data, colWidths=[3.0*cm, 2.5*cm, 9.9*cm])
trait_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD) for i in range(1, 15)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(trait_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 5: Governor Trait Effects', caption_style))
story.append(Spacer(1, 18))

# ==================== 5. LOYALTY AND TRAITS SYSTEM ====================
story.append(Paragraph('<b>5. Loyalty and Traits System</b>', h1_style))

story.append(Paragraph('<b>5.1 Loyalty Mechanics</b>', h2_style))
story.append(Paragraph(
    'The Loyalty System tracks a 0-100 loyalty value for each city that represents how strongly the population supports the '
    'Supreme Commander. Loyalty is not static: it decays naturally at 0.3 points per turn when above 50 (representing the '
    'tendency of distant provinces to drift toward autonomy), and is affected by a wide range of events and player decisions. '
    'High taxes reduce loyalty proportionally, assigning a new governor causes a small temporary dip, dismissing a governor '
    'causes a significant -5 point penalty, conscripting soldiers costs -3 loyalty per city, and military defeats can cost up '
    'to -10 loyalty. Conversely, victories (+8), festivals (+5), and reduced taxes (+10) can boost loyalty. The system tracks '
    'every loyalty change in a history log with the turn number, amount, before/after values, and reason, allowing the player '
    'to understand why loyalty is trending in a particular direction and take corrective action.',
    body_style
))
story.append(Paragraph(
    'Loyalty directly affects gameplay through three multiplier systems. The Productivity Modifier ranges from 0.7x at very '
    'low loyalty to 1.2x at high loyalty, meaning that loyal cities produce significantly more than disloyal ones. The '
    'Maintenance Cost Modifier ranges from 0.9x to 1.5x, making disloyal cities more expensive to maintain. Most critically, '
    'the Desertion Chance determines the probability each turn that soldiers from that city will desert: 2% at loyalty 30-50, '
    '5% at loyalty 15-30, and 10% below loyalty 15. These interconnected systems create a compelling strategic loop where the '
    'player must balance taxation for income against loyalty for productivity, and heavy military recruitment against the risk '
    'of desertion and rebellion in over-recruited cities.',
    body_style
))

story.append(Paragraph('<b>5.2 Rebellion System</b>', h2_style))
story.append(Paragraph(
    'When loyalty drops below 45, the city enters progressively escalating rebellion risk levels. Between 45 and 30 is "Low" '
    'risk with minor unrest effects. Between 30 and 15 is "Medium" risk where the population status shifts to Discontent, '
    'reducing productivity. Between 15 and 10 is "High" risk with significant unrest. Below 10, the city enters active '
    '"Rebellion" state where each turn has a base 15% chance of triggering an actual rebellion. This chance is modified by '
    'two factors: a crisis multiplier that increases as loyalty approaches zero, and a trend multiplier of 1.5x when loyalty '
    'is actively falling (negative trend). A rebellion event fires the OnRebellionStarted event, which the game can use to '
    'spawn rebel armies, destroy buildings, or transfer city control to an AI faction. The rebellion system creates a hard '
    'deadline for the player to address loyalty problems before catastrophic consequences occur, adding urgency and tension '
    'to the strategic decision-making process.',
    body_style
))

story.append(Paragraph('<b>5.3 Trait Effects on Loyalty</b>', h2_style))
story.append(Spacer(1, 6))

loyalty_data = [
    [Paragraph('<b>Event</b>', tbl_header_style),
     Paragraph('<b>Loyalty Change</b>', tbl_header_style),
     Paragraph('<b>Reason Category</b>', tbl_header_style)],
    [Paragraph('Festival held', tbl_cell_left), Paragraph('+5', tbl_cell_style), Paragraph('Cultural', tbl_cell_style)],
    [Paragraph('Market / Temple built', tbl_cell_left), Paragraph('+3 to +5', tbl_cell_style), Paragraph('Development', tbl_cell_style)],
    [Paragraph('Victory celebration', tbl_cell_left), Paragraph('+8', tbl_cell_style), Paragraph('Military', tbl_cell_style)],
    [Paragraph('Tax reduction', tbl_cell_left), Paragraph('+10', tbl_cell_style), Paragraph('Economic', tbl_cell_style)],
    [Paragraph('High taxes imposed', tbl_cell_left), Paragraph('-8', tbl_cell_style), Paragraph('Economic', tbl_cell_style)],
    [Paragraph('Army conscripted', tbl_cell_left), Paragraph('-5', tbl_cell_style), Paragraph('Military', tbl_cell_style)],
    [Paragraph('Food shortage', tbl_cell_left), Paragraph('-10', tbl_cell_style), Paragraph('Crisis', tbl_cell_style)],
    [Paragraph('Plague', tbl_cell_left), Paragraph('-15', tbl_cell_style), Paragraph('Crisis', tbl_cell_style)],
    [Paragraph('Natural disaster', tbl_cell_left), Paragraph('-12', tbl_cell_style), Paragraph('Crisis', tbl_cell_style)],
    [Paragraph('City occupied', tbl_cell_left), Paragraph('-20', tbl_cell_style), Paragraph('Military', tbl_cell_style)],
    [Paragraph('Defeat in battle', tbl_cell_left), Paragraph('-10', tbl_cell_style), Paragraph('Military', tbl_cell_style)],
    [Paragraph('Governor assigned', tbl_cell_left), Paragraph('-2', tbl_cell_style), Paragraph('Political', tbl_cell_style)],
    [Paragraph('Governor corrupt', tbl_cell_left), Paragraph('-8', tbl_cell_style), Paragraph('Political', tbl_cell_style)],
]

loyalty_table = Table(loyalty_data, colWidths=[5.0*cm, 3.5*cm, 6.9*cm])
loyalty_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD) for i in range(1, 14)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(loyalty_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 6: Loyalty Change Events', caption_style))
story.append(Spacer(1, 18))

# ==================== 6. SUPREME COMMANDER ====================
story.append(Paragraph('<b>6. Supreme Commander (Player Controller)</b>', h1_style))

story.append(Paragraph('<b>6.1 Player Commands</b>', h2_style))
story.append(Paragraph(
    'The Supreme Commander serves as the player interface to the game world. Rather than exposing all system internals, it '
    'provides a clean set of high-level commands that map to the strategic decisions a ruler would actually make. The '
    'AssignGovernor command creates a new AI governor and attaches it to a city, automatically creating a PopulationManager if '
    'one does not exist and wiring up event listeners for reports and resource requests. The DismissGovernor command removes the '
    'governor and applies a -5 loyalty penalty to reflect the population reaction. The SetTaxRate command adjusts the global tax '
    'rate between 0% and 50%, with the loyalty and happiness impacts proportional to the change magnitude. The CreateAndMoveArmy '
    'command handles the complete flow of recruiting soldiers from a city, creating an army state object, and setting it on a '
    'movement path toward a target city, with all the loyalty and population side effects handled transparently.',
    body_style
))

story.append(Paragraph('<b>6.2 Budget Management</b>', h2_style))
story.append(Paragraph(
    'Each turn, the Budget Update cycle aggregates gold production from all cities, applies the global tax rate, subtracts '
    'maintenance costs (including a 10% food distribution overhead per city), and updates the treasury balance. The system '
    'fires OnBudgetChanged events with the total income and expenses, allowing the UI to display the current fiscal status. The '
    'Supreme Commander also tracks command history, storing each player decision with its turn number, target city, and parameters. '
    'This history serves both as a debug tool and as potential material for a post-game replay system. The notification system '
    'queues messages from all subsystems (governor assignments, army movements, resource requests) and presents the most recent '
    '50 to the player, ensuring that important information is never lost even during busy turns with many simultaneous events.',
    body_style
))

story.append(Paragraph('<b>6.3 Notification System</b>', h2_style))
story.append(Paragraph(
    'The notification system is designed with mobile UX in mind, recognizing that players may be distracted and miss on-screen '
    'events. All major game events generate notifications that are stored in a queue with turn numbers and descriptive text. '
    'The Supreme Commander collects notifications from governor reports, army movements, loyalty changes, and player commands, '
    'formatting them with contextual information such as city names, governor names, and numerical values. The UI can poll '
    'GetRecentNotifications(10) to display the last 10 notifications, and ClearNotifications() to reset the queue. Future '
    'expansions of this system could include notification categories (military, economic, political), priority levels for '
    'push notifications on Android, and a notification history screen that allows the player to review past events. The '
    'notification format uses a turn prefix followed by an emoji indicator for quick visual scanning, such as a crown icon for '
    'governor assignments, a sword icon for military events, and a coin icon for economic updates.',
    body_style
))

# ==================== BUILD ====================
doc.build(story)
print(f"PDF generated: {output_path}")
