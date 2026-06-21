"""Seed humanities and social-sciences resources into the database.

This script is idempotent: existing resources are skipped based on their id.
Run it after migrations/admin creation to populate a richer catalog.

Example:
    cd backend
    .venv/bin/python scripts/seed_resources.py
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session, engine
from app.models.models import Base, Resource


SEED_DATA: list[dict] = [
    # Humanities
    {
        "id": "republic-plato-375-bc",

        "type": "book",

        "title": "理想国",

        "authors": ["Plato"],
        "year": -375,
        "venue": "古希腊哲学对话录",

        "discipline": "humanities",

        "subdiscipline": "philosophy",

        "tags": ["政治哲学“, ”正义“, ”乌托邦“, ”古希腊哲学"],
        "abstract": "柏拉图以苏格拉底为主角，探讨正义、理想城邦、灵魂三分与哲人王统治的经典对话录，奠定了西方政治哲学与形而上学的基石。",

        "preview": "西方政治哲学奠基之作，借苏格拉底之口追问“什么是正义”并构想理想城邦。",

        "download_url": None,
        "external_url": "https://www.gutenberg.org/ebooks/1497",

        "doi": None,
        "citation": {
            "apa": "Plato. (n.d.). The Republic.",

            "mla": "Plato. The Republic.",

            "gbt": "Plato. 理想国[M].",

            "bibtex": "@book{plato_republic, title={The Republic}, author={Plato}}",
        },
        "citations": 85000,
        "added_at": "2026-06-21",

    },
    {
        "id": "nicomachean-ethics-aristotle",

        "type": "book",

        "title": "尼各马可伦理学",

        "authors": ["Aristotle"],
        "year": -350,
        "venue": "古希腊伦理学经典",

        "discipline": "humanities",

        "subdiscipline": "philosophy",

        "tags": ["伦理学“, ”德性“, ”幸福“, ”实践智慧"],
        "abstract": "亚里士多德系统阐述德性伦理学，提出“幸福是实现灵魂合乎德性的活动”，并深入讨论勇敢、节制、正义、友谊与沉思生活。",

        "preview": "亚里士多德德性伦理学的核心文本，探讨幸福、德性与良好生活的本质。",

        "download_url": None,
        "external_url": "https://www.gutenberg.org/ebooks/8438",

        "doi": None,
        "citation": {
            "apa": "Aristotle. (n.d.). Nicomachean Ethics.",

            "mla": "Aristotle. Nicomachean Ethics.",

            "gbt": "Aristotle. 尼各马可伦理学[M].",

            "bibtex": "@book{aristotle_ethics, title={Nicomachean Ethics}, author={Aristotle}}",
        },
        "citations": 62000,
        "added_at": "2026-06-21",

    },
    {
        "id": "history-of-the-peloponnesian-war-thucydides",

        "type": "book",

        "title": "伯罗奔尼撒战争史",

        "authors": ["Thucydides"],
        "year": -400,
        "venue": "古希腊史学经典",

        "discipline": "humanities",

        "subdiscipline": "history",

        "tags": ["古希腊史“, ”战争史“, ”国际关系“, ”修昔底德陷阱"],
        "abstract": "修昔底德以亲历者身份记述雅典与斯巴达之间的伯罗奔尼撒战争，被誉为西方政治现实主义与国际关系理论的源头之一。",

        "preview": "西方史学与政治现实主义传统的奠基之作，记录雅典与斯巴达的世纪战争。",

        "download_url": None,
        "external_url": "https://www.gutenberg.org/ebooks/7142",

        "doi": None,
        "citation": {
            "apa": "Thucydides. (n.d.). History of the Peloponnesian War.",

            "mla": "Thucydides. History of the Peloponnesian War.",

            "gbt": "Thucydides. 伯罗奔尼撒战争史[M].",

            "bibtex": "@book{thucydides_war, title={History of the Peloponnesian War}, author={Thucydides}}",
        },
        "citations": 45000,
        "added_at": "2026-06-21",

    },
    {
        "id": "the-open-society-and-its-enemies-popper-1945",

        "type": "book",

        "title": "开放社会及其敌人",

        "authors": ["Karl Popper"],
        "year": 1945,
        "venue": "Routledge",

        "discipline": "humanities",

        "subdiscipline": "philosophy",

        "tags": ["政治哲学“, ”开放社会“, ”历史决定论“, ”批判理性主义"],
        "abstract": "波普尔批判柏拉图、黑格尔与马克思的历史决定论，捍卫开放社会、民主制度与批判理性主义，对二十世纪政治哲学影响深远。",

        "preview": "波普尔为开放社会辩护，批判历史决定论与极权主义思想根源。",

        "download_url": None,
        "external_url": "https://archive.org/details/opensocietyandit01popp",

        "doi": None,
        "citation": {
            "apa": "Popper, K. (1945). The Open Society and Its Enemies. Routledge.",

            "mla": "Popper, Karl. The Open Society and Its Enemies. Routledge, 1945.",

            "gbt": "Popper K. 开放社会及其敌人[M]. Routledge, 1945.",

            "bibtex": "@book{popper1945open, title={The Open Society and Its Enemies}, author={Popper, Karl}, year={1945}, publisher={Routledge}}",
        },
        "citations": 38000,
        "added_at": "2026-06-21",

    },
    {
        "id": "the-waste-land-eliot-1922",

        "type": "paper",

        "title": "荒原",

        "authors": ["T. S. Eliot"],
        "year": 1922,
        "venue": "The Criterion",

        "discipline": "humanities",

        "subdiscipline": "literature",

        "tags": ["现代主义诗歌“, ”艾略特“, ”文学批评“, ”英美文学"],
        "abstract": "T. S. 艾略特的长诗《荒原》以破碎的意象与多语言引文描绘战后西方文明的精神荒芜，被公认为现代主义诗歌的里程碑。",

        "preview": "现代主义诗歌里程碑，以碎片化的意象呈现战后文明的荒芜与救赎渴望。",

        "download_url": None,
        "external_url": "https://www.bartleby.com/201/1.html",

        "doi": None,
        "citation": {
            "apa": "Eliot, T. S. (1922). The Waste Land. The Criterion.",

            "mla": "Eliot, T. S. “The Waste Land.” The Criterion, 1922.",

            "gbt": "Eliot T S. 荒原[J]. The Criterion, 1922.",

            "bibtex": "@article{eliot1922waste, title={The Waste Land}, author={Eliot, T. S.}, journal={The Criterion}, year={1922}}",
        },
        "citations": 22000,
        "added_at": "2026-06-21",

    },
    {
        "id": "art-history-janson-1962",

        "type": "book",

        "title": "艺术史",

        "authors": ["H. W. Janson", "Anthony F. Janson"],
        "year": 1962,
        "venue": "Harry N. Abrams",

        "discipline": "humanities",

        "subdiscipline": "art-history",

        "tags": ["艺术史“, ”视觉艺术“, ”西方艺术“, ”教材"],
        "abstract": "《艺术史》是西方艺术史领域最广泛使用的教材之一，系统梳理从史前艺术到现代艺术的风格演变、社会语境与关键作品。",

        "preview": "西方艺术史经典教材，贯通史前至现代的艺术风格与社会语境。",

        "download_url": None,
        "external_url": "https://www.abramsbooks.com/product/art-history_9780134035835/",

        "doi": None,
        "citation": {
            "apa": "Janson, H. W., & Janson, A. F. (1962). History of Art. Harry N. Abrams.",

            "mla": "Janson, H. W., and Anthony F. Janson. History of Art. Harry N. Abrams, 1962.",

            "gbt": "Janson H W, Janson A F. 艺术史[M]. Harry N. Abrams, 1962.",

            "bibtex": "@book{janson1962history, title={History of Art}, author={Janson, H. W. and Janson, Anthony F.}, year={1962}, publisher={Harry N. Abrams}}",
        },
        "citations": 15000,
        "added_at": "2026-06-21",

    },
    # Social Sciences
    {
        "id": "the-general-theory-keynes-1936",

        "type": "book",

        "title": "就业、利息和货币通论",

        "authors": ["John Maynard Keynes"],
        "year": 1936,
        "venue": "Macmillan",

        "discipline": "social-sciences",

        "subdiscipline": "economics",

        "tags": ["宏观经济学“, ”凯恩斯主义“, ”有效需求“, ”失业"],
        "abstract": "凯恩斯在《通论》中挑战古典经济学，提出有效需求不足导致失业，主张政府通过财政与货币政策干预经济，奠定现代宏观经济学基础。",

        "preview": "现代宏观经济学奠基之作，提出有效需求理论与政府干预经济的理论基础。",

        "download_url": None,
        "external_url": "https://archive.org/details/in.ernet.dli.2015.499719",

        "doi": None,
        "citation": {
            "apa": "Keynes, J. M. (1936). The General Theory of Employment, Interest, and Money. Macmillan.",

            "mla": "Keynes, John Maynard. The General Theory of Employment, Interest, and Money. Macmillan, 1936.",

            "gbt": "Keynes J M. 就业、利息和货币通论[M]. Macmillan, 1936.",

            "bibtex": "@book{keynes1936general, title={The General Theory of Employment, Interest, and Money}, author={Keynes, John Maynard}, year={1936}, publisher={Macmillan}}",
        },
        "citations": 95000,
        "added_at": "2026-06-21",

    },
    {
        "id": "capital-marx-1867",

        "type": "book",

        "title": "资本论（第一卷）",

        "authors": ["Karl Marx"],
        "year": 1867,
        "venue": "Verlag von Otto Meisner",

        "discipline": "social-sciences",

        "subdiscipline": "economics",

        "tags": ["政治经济学“, ”马克思主义“, ”剩余价值“, ”资本主义批判"],
        "abstract": "马克思系统分析资本主义生产方式，揭示商品二重性、剩余价值来源与资本积累规律，对经济学、社会学与政治学产生深远影响。",

        "preview": "马克思剖析资本主义生产方式的核心著作，揭示剩余价值与资本积累机制。",

        "download_url": None,
        "external_url": "https://www.marxists.org/archive/marx/works/1867-c1/",

        "doi": None,
        "citation": {
            "apa": "Marx, K. (1867). Capital: A Critique of Political Economy (Vol. 1). Verlag von Otto Meisner.",

            "mla": "Marx, Karl. Capital: A Critique of Political Economy. Vol. 1, Verlag von Otto Meisner, 1867.",

            "gbt": "Marx K. 资本论（第一卷）[M]. Verlag von Otto Meisner, 1867.",

            "bibtex": "@book{marx1867capital, title={Capital: A Critique of Political Economy}, author={Marx, Karl}, volume={1}, year={1867}, publisher={Verlag von Otto Meisner}}",
        },
        "citations": 88000,
        "added_at": "2026-06-21",

    },
    {
        "id": "the-interpretation-of-dreams-freud-1899",

        "type": "book",

        "title": "梦的解析",

        "authors": ["Sigmund Freud"],
        "year": 1899,
        "venue": "Franz Deuticke",

        "discipline": "social-sciences",

        "subdiscipline": "psychology",

        "tags": ["精神分析“, ”潜意识“, ”梦“, ”心理学"],
        "abstract": "弗洛伊德在《梦的解析》中提出梦是通往潜意识的皇家大道，系统阐述凝缩、移置、象征与二次修饰等梦的运作机制。",

        "preview": "精神分析学奠基之作，提出梦是愿望满足与通往潜意识的途径。",

        "download_url": None,
        "external_url": "https://www.gutenberg.org/ebooks/66048",

        "doi": None,
        "citation": {
            "apa": "Freud, S. (1899). The Interpretation of Dreams. Franz Deuticke.",

            "mla": "Freud, Sigmund. The Interpretation of Dreams. Franz Deuticke, 1899.",

            "gbt": "Freud S. 梦的解析[M]. Franz Deuticke, 1899.",

            "bibtex": "@book{freud1899dreams, title={The Interpretation of Dreams}, author={Freud, Sigmund}, year={1899}, publisher={Franz Deuticke}}",
        },
        "citations": 75000,
        "added_at": "2026-06-21",

    },
    {
        "id": "cognitive-therapy-depression-beck-1979",

        "type": "book",

        "title": "抑郁症的认知治疗",

        "authors": ["Aaron T. Beck"],
        "year": 1979,
        "venue": "Guilford Press",

        "discipline": "social-sciences",

        "subdiscipline": "psychology",

        "tags": ["认知行为疗法“, ”抑郁症“, ”心理治疗“, ”临床心理学"],
        "abstract": "贝克提出认知治疗模型，认为抑郁源于负性自动思维与认知三联征（对自己、世界、未来的消极看法），并发展出系统的治疗技术。",

        "preview": "认知行为疗法奠基性临床手册，为抑郁症治疗提供系统的认知干预框架。",

        "download_url": None,
        "external_url": "https://guilford.com/books/Cognitive-Therapy-of-Depression/Aaron-Beck/9780898629194",

        "doi": None,
        "citation": {
            "apa": "Beck, A. T. (1979). Cognitive Therapy of Depression. Guilford Press.",

            "mla": "Beck, Aaron T. Cognitive Therapy of Depression. Guilford Press, 1979.",

            "gbt": "Beck A T. 抑郁症的认知治疗[M]. Guilford Press, 1979.",

            "bibtex": "@book{beck1979cognitive, title={Cognitive Therapy of Depression}, author={Beck, Aaron T.}, year={1979}, publisher={Guilford Press}}",
        },
        "citations": 54000,
        "added_at": "2026-06-21",

    },
    {
        "id": "the-division-of-labor-durkheim-1893",

        "type": "book",

        "title": "社会分工论",

        "authors": ["Émile Durkheim"],
        "year": 1893,
        "venue": "Félix Alcan",

        "discipline": "social-sciences",

        "subdiscipline": "sociology",

        "tags": ["社会学“, ”社会分工“, ”有机团结“, ”失范"],
        "abstract": "涂尔干区分机械团结与有机团结，论证社会分工如何整合现代社会，并引入“失范”概念解释社会转型期的规范缺失。",

        "preview": "社会学经典，提出机械团结与有机团结的区分，奠定现代社会分工理论。",

        "download_url": None,
        "external_url": "https://archive.org/details/divisionoflabour00durk",

        "doi": None,
        "citation": {
            "apa": "Durkheim, É. (1893). The Division of Labor in Society. Félix Alcan.",

            "mla": "Durkheim, Émile. The Division of Labor in Society. Félix Alcan, 1893.",

            "gbt": "Durkheim É. 社会分工论[M]. Félix Alcan, 1893.",

            "bibtex": r"@book{durkheim1893division, title={The Division of Labor in Society}, author={Durkheim, {\'E}mile}, year={1893}, publisher={F\'elix Alcan}}",
        },
        "citations": 42000,
        "added_at": "2026-06-21",

    },
    {
        "id": "the-protestant-ethic-weber-1905",

        "type": "book",

        "title": "新教伦理与资本主义精神",

        "authors": ["Max Weber"],
        "year": 1905,
        "venue": "Archiv für Sozialwissenschaft und Sozialpolitik",

        "discipline": "social-sciences",

        "subdiscipline": "sociology",

        "tags": ["社会学“, ”宗教社会学“, ”资本主义“, ”现代性"],
        "abstract": "韦伯探讨加尔文宗新教伦理如何催生现代资本主义精神，强调文化观念对经济行为的塑造作用，奠定宗教社会学基础。",

        "preview": "宗教社会学经典，论证新教伦理与现代资本主义精神之间的亲和关系。",

        "download_url": None,
        "external_url": "https://archive.org/details/protestantethic00webe",

        "doi": None,
        "citation": {
            "apa": "Weber, M. (1905). The Protestant Ethic and the Spirit of Capitalism. Archiv für Sozialwissenschaft und Sozialpolitik.",

            "mla": "Weber, Max. “The Protestant Ethic and the Spirit of Capitalism.” Archiv für Sozialwissenschaft und Sozialpolitik, 1905.",

            "gbt": "Weber M. 新教伦理与资本主义精神[J]. Archiv für Sozialwissenschaft und Sozialpolitik, 1905.",

            "bibtex": r"@article{weber1905protestant, title={The Protestant Ethic and the Spirit of Capitalism}, author={Weber, Max}, journal={Archiv f{\"u}r Sozialwissenschaft und Sozialpolitik}, year={1905}}",
        },
        "citations": 68000,
        "added_at": "2026-06-21",

    },
    {
        "id": "political-order-oligarchies-michels-1911",

        "type": "book",

        "title": "寡头统治铁律：现代民主制度中的政党社会学",

        "authors": ["Robert Michels"],
        "year": 1911,
        "venue": "Klinkhardt",

        "discipline": "social-sciences",

        "subdiscipline": "political-science",

        "tags": ["政治学“, ”政党社会学“, ”寡头统治“, ”民主理论"],
        "abstract": "米歇尔斯提出“寡头统治铁律”，认为大型组织由于技术分工与领导专业化，必然趋向寡头化，对民主理论与实践提出深刻挑战。",

        "preview": "政党社会学经典，提出“寡头统治铁律”，分析组织与民主的张力。",

        "download_url": None,
        "external_url": "https://archive.org/details/politicalparties00mich",

        "doi": None,
        "citation": {
            "apa": "Michels, R. (1911). Political Parties: A Sociological Study of the Oligarchical Tendencies of Modern Democracy. Klinkhardt.",

            "mla": "Michels, Robert. Political Parties: A Sociological Study of the Oligarchical Tendencies of Modern Democracy. Klinkhardt, 1911.",

            "gbt": "Michels R. 寡头统治铁律：现代民主制度中的政党社会学[M]. Klinkhardt, 1911.",

            "bibtex": "@book{michels1911parties, title={Political Parties: A Sociological Study of the Oligarchical Tendencies of Modern Democracy}, author={Michels, Robert}, year={1911}, publisher={Klinkhardt}}",
        },
        "citations": 25000,
        "added_at": "2026-06-21",

    },
    {
        "id": "world-values-survey-dataset",

        "type": "dataset",

        "title": "World Values Survey",

        "authors": ["World Values Survey Association"],
        "year": 2022,
        "venue": "Open Social Science Data Repository",

        "discipline": "social-sciences",

        "subdiscipline": "social-research",

        "tags": ["调查数据“, ”价值观“, ”跨国比较“, ”社会科学数据"],
        "abstract": "世界价值观调查是全球最大的跨国社会态度与价值观重复横截面调查，涵盖民主、性别、宗教、幸福、信任等议题，开放下载用于学术研究。",

        "preview": "全球最大跨国价值观与社会态度调查数据集，支持经济学、社会学与政治学的比较研究。",

        "download_url": "https://www.worldvaluessurvey.org/WVSDocumentationWV7.jsp",

        "external_url": "https://www.worldvaluessurvey.org/",

        "doi": None,
        "citation": {
            "apa": "World Values Survey Association. (2022). World Values Survey.",

            "mla": "World Values Survey Association. World Values Survey. 2022.",

            "gbt": "World Values Survey Association. World Values Survey[DB/OL]. 2022.",

            "bibtex": "@misc{wvs2022, title={World Values Survey}, author={World Values Survey Association}, year={2022}}",
        },
        "citations": 18000,
        "added_at": "2026-06-21",

    },
]


async def seed_resources(session: AsyncSession) -> None:
    for item in SEED_DATA:
        result = await session.execute(select(Resource).where(Resource.id == item["id"]))
        if result.scalar_one_or_none():
            print(f"Skipping existing resource: {item['id']}")
            continue

        resource = Resource(**item)
        session.add(resource)
        print(f"Adding resource: {item['id']}")

    await session.commit()


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        await seed_resources(session)


if __name__ == "__main__":
    asyncio.run(main())
