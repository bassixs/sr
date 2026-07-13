import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import heroImage from '../photo/1.webp';
import forestImage from '../photo/2.webp';
import treatmentImage from '../photo/3.webp';
import roomImage from '../photo/4.webp';
import familyImage from '../photo/5.webp';
import staffImage from '../photo/6.webp';
import documentsImage from '../photo/7.webp';
import {
  advantages,
  arrivalDocumentGroups,
  arrivalFlow,
  arrivalTips,
  audienceCards,
  contacts,
  contactAppealFlow,
  contactChannels,
  contactDetailGroups,
  contactPurposeGroups,
  contactRequestTips,
  contactRouteNotes,
  careTeamFlow,
  doctorCardTemplate,
  doctorProfiles,
  documentFlow,
  guestJourney,
  homeTaskLinks,
  infrastructure,
  institutionDetails,
  keyStats,
  leisureCards,
  licensedWorkGroups,
  licenseDetails,
  mealDetails,
  news,
  officialDocuments,
  officialFacts,
  officialSections,
  oversightContacts,
  paidServiceRules,
  patientRightsGroups,
  procedureGroups,
  procedureAssignmentFlow,
  procedureDayFlow,
  procedureHighlights,
  procedurePurposeDetails,
  procedureRules,
  procedureSafetyGroups,
  packingList,
  roomCategoryDetails,
  roomNotes,
  routes,
  staffRequests,
  staffRoleGroups,
  staffPublicationRules,
  stayInfrastructureGroups,
  stayQuestions,
  stayRoutine,
  stayRules,
  stayComfort,
  teamPrinciples,
  treatmentMyths,
  treatmentAudience,
  treatmentPrinciples,
  treatmentProfileDetails,
  treatmentProgramDetails,
  treatmentPrograms,
  treatmentSafetyGroups,
  legalPages,
  priceGroups,
  priceMeta,
  scheduleRows,
  scheduleMeta,
  type ChecklistGroup,
  type DetailGroup,
  type InfoCard,
  type LegalPageContent,
} from './content';
import { SanatoriumGallery } from './gallery';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const primaryNavPaths = ['/', '/about', '/treatment', '/procedures', '/doctors', '/stay', '/prepare', '/contacts'];
const heroFacts = ['40+ лет опыта', '150 коек', 'дети с 4 лет'];
const footerNavigation = [
  {
    title: 'Санаторий',
    paths: ['/', '/about', '/treatment', '/procedures', '/doctors'],
  },
  {
    title: 'Поездка',
    paths: ['/stay', '/prepare', '/oms', '/contacts'],
  },
  {
    title: 'Официально',
    paths: ['/official', '/privacy', '/accessibility', '/quality', '/anti-corruption', '/news'],
  },
];
const routeDescriptions: Record<string, string> = {
  '/': 'Калужский санаторий Звездный: лечение, процедуры, врачи, проживание, документы, ОМС и официальная информация для гостей.',
  '/about': 'Информация о Калужском санатории Звездный: лечебная база, лесная территория, инфраструктура, история и особенности санаторного восстановления.',
  '/treatment': 'Программы и профили лечения в санатории Звездный: кому подходит курс, как назначаются процедуры и какие ограничения важно учитывать.',
  '/procedures': 'Процедуры санатория Звездный: водолечение, ЛФК, физиотерапия, массаж, природные факторы и правила назначения врачом.',
  '/doctors': 'Врачи и персонал санатория Звездный: как устроено медицинское сопровождение, какие роли есть в команде и какие данные нужны для карточек специалистов.',
  '/stay': 'Проживание, питание и инфраструктура санатория Звездный: распорядок дня, номера, лечебное питание и условия пребывания.',
  '/prepare': 'Подготовка к заезду в санаторий Звездный: документы, санаторно-курортная карта, правила пребывания и практические подсказки для гостей.',
  '/oms': 'ОМС, цены и график заездов санатория Звездный: прейскурант, путевки, платные услуги и официальные документы.',
  '/official': 'Официальная информация санатория Звездный: лицензия, устав, ЕГРЮЛ, реквизиты, права пациента, контролирующие органы и платные услуги.',
  '/news': 'Новости санатория Звездный, объявления, материалы о здоровье, графиках, профилактике и жизни учреждения.',
  '/contacts': 'Контакты санатория Звездный: телефон, email, адреса, порядок обращения, подготовка запроса и данные для связи.',
  ...Object.fromEntries(legalPages.map((page) => [page.path, page.intro])),
};

function getPhoneHref(phone: string) {
  const normalized = phone.replace(/[^+\d]/g, '');
  return normalized.replace(/\D/g, '').length >= 10 ? `tel:${normalized}` : null;
}

function getRouteDescription(path: string) {
  return routeDescriptions[path] ?? routeDescriptions['/'];
}

function setMetaByName(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }

  element.content = content;
}

function setMetaByProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }

  element.content = content;
}

function setCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }

  element.href = href;
}

function normalizePath(pathname: string) {
  let path = pathname;

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length) || '/';
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return path.replace(/\/$/, '') || '/';
}

function getHref(path: string) {
  const normalized = path === '/' ? '/' : path;
  return `${basePath}${normalized}`;
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [accessible, setAccessible] = useState(() => {
    try {
      return localStorage.getItem('accessible') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('accessible-mode', accessible);
    try {
      localStorage.setItem('accessible', accessible ? '1' : '0');
    } catch {
      /* localStorage может быть недоступен — игнорируем */
    }
  }, [accessible]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [currentPath]);

  useEffect(() => {
    const siteTitle = 'Калужский санаторий Звездный — официальный информационный сайт';
    const route = routes.find((item) => item.path === currentPath);
    const title = route && currentPath !== '/' ? `${route.label} — Калужский санаторий Звездный` : siteTitle;
    const description = getRouteDescription(currentPath);
    const canonicalUrl = new URL(getHref(currentPath), window.location.origin).toString();

    document.title = title;
    setMetaByName('description', description);
    setMetaByName('twitter:title', title);
    setMetaByName('twitter:description', description);
    setMetaByProperty('og:title', title);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:url', canonicalUrl);
    setCanonical(canonicalUrl);
  }, [currentPath]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-animate]'));

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [currentPath]);

  const activeRoute = useMemo(
    () => routes.find((route) => route.path === currentPath) ?? routes[0],
    [currentPath],
  );
  const isKnownPage = currentPath in pages;

  const navigate = (path: string) => {
    window.history.pushState({}, '', getHref(path));
    setCurrentPath(path);
  };

  const Page = pages[currentPath] ?? NotFoundPage;

  return (
    <div className="page">
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <Header
        activePath={activeRoute.path}
        accessible={accessible}
        onToggleAccessible={() => setAccessible((value) => !value)}
        onNavigate={navigate}
      />
      {currentPath !== '/' && isKnownPage ? <Breadcrumbs currentPath={currentPath} onNavigate={navigate} /> : null}
      <main id="main-content" tabIndex={-1}>
        <Page onNavigate={navigate} />
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

function Breadcrumbs({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const currentRoute = routes.find((route) => route.path === currentPath);

  if (!currentRoute) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <div className="container breadcrumbs-inner">
        <a
          href={getHref('/')}
          onClick={(event) => {
            event.preventDefault();
            onNavigate('/');
          }}
        >
          Главная
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{currentRoute.label}</span>
      </div>
    </nav>
  );
}

type NavigationProps = {
  activePath?: string;
  accessible?: boolean;
  onToggleAccessible?: () => void;
  onNavigate: (path: string) => void;
};

function Header({ activePath, accessible, onToggleAccessible, onNavigate }: NavigationProps) {
  const mainRoutes = routes.filter((route) => primaryNavPaths.includes(route.path));
  const phoneHref = getPhoneHref(contacts.phone);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-top">
        <a
          className="brand"
          href={getHref('/')}
          onClick={(event) => {
            event.preventDefault();
            onNavigate('/');
          }}
          aria-label="Калужский санаторий Звездный"
        >
          <span className="brand-mark">З</span>
          <span>
            <strong>Звездный</strong>
            <small>Калужский санаторий</small>
          </span>
        </a>

        <div className="header-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
            {menuOpen ? 'Закрыть' : 'Меню'}
          </button>
          <button
            className="utility-button"
            type="button"
            onClick={onToggleAccessible}
            aria-pressed={!!accessible}
          >
            {accessible ? 'Обычная версия' : 'Версия для слабовидящих'}
          </button>
          {phoneHref ? (
            <a className="phone-link" href={phoneHref}>
              {contacts.phone}
            </a>
          ) : (
            <span className="phone-link phone-link-muted">{contacts.phone}</span>
          )}
        </div>
      </div>

      <nav id="primary-navigation" className={`container nav-grid${menuOpen ? ' is-open' : ''}`} aria-label="Основная навигация">
        <div className="nav-row">
          {mainRoutes.map((item) => (
            <NavLink key={item.path} item={item} activePath={activePath} onNavigate={(path) => { setMenuOpen(false); onNavigate(path); }} />
          ))}
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  item,
  activePath,
  onNavigate,
}: {
  item: { label: string; path: string };
  activePath?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <a
      className={item.path === activePath ? 'is-active' : undefined}
      href={getHref(item.path)}
      aria-current={item.path === activePath ? 'page' : undefined}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(item.path);
      }}
    >
      {item.label}
    </a>
  );
}

type PageProps = {
  onNavigate: (path: string) => void;
};

function getDelay(index: number): CSSProperties {
  return { '--delay': `${Math.min(index, 6) * 80}ms` } as CSSProperties;
}

function AnimatedStat({ value, delay = 0 }: { value: string; delay?: number }) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [displayValue, setDisplayValue] = useState(() => value.replace(/\d+/u, '0'));

  useEffect(() => {
    const element = elementRef.current;
    const numberMatch = value.match(/\d+/u);

    if (!element || !numberMatch) {
      setDisplayValue(value);
      return;
    }

    const target = Number(numberMatch[0]);
    const prefix = value.slice(0, numberMatch.index);
    const suffix = value.slice((numberMatch.index ?? 0) + numberMatch[0].length);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    let start = 0;
    let timeout = 0;
    let started = false;

    const animate = (timestamp: number) => {
      if (!start) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / 1150, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplayValue(`${prefix}${current}${suffix}`);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          timeout = window.setTimeout(() => {
            frame = window.requestAnimationFrame(animate);
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, value]);

  return <strong ref={elementRef}>{displayValue}</strong>;
}

function HomePage({ onNavigate }: PageProps) {
  const taskPaths = ['/treatment', '/procedures', '/prepare', '/official'];

  return (
    <>
      <section className="hero hero-cover" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">Калужский санаторий Звездный</span>
            <h1>Восстановление и отдых в лесном санатории рядом с Калугой</h1>
            <p>
              Здесь можно спокойно разобраться, кому подходит санаторий, какие есть программы,
              какие процедуры назначают врачи и что подготовить перед заездом.
            </p>
            <div className="hero-facts" aria-label="Ключевые факты">
              {heroFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => onNavigate('/treatment')}>
                Посмотреть программы
              </button>
              <button className="button button-secondary" type="button" onClick={() => onNavigate('/prepare')}>
                Документы перед заездом
              </button>
            </div>
          </div>
          <aside className="hero-scene-note" aria-label="Ключевая особенность санатория">
            <span>Лесной массив</span>
            <strong>Лечебная база для профилактики, восстановления и семейного отдыха</strong>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Быстрый выбор"
            title="Что вы хотите узнать в первую очередь"
            text="Если вы родитель, пациент, сопровождающий или ищете документы, начните отсюда: каждый вход ведет к практическому разделу без лишнего поиска по меню."
          />
          <div className="task-link-grid">
            {homeTaskLinks.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(taskPaths[index])}
                aria-label={`${item.title}: перейти в раздел ${item.meta}`}
                data-animate
                style={getDelay(index)}
              >
                {item.meta ? <span>{item.meta}</span> : null}
                <strong>{item.title}</strong>
                <em>{item.text}</em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-stats">
        <div className="container stat-ribbon" data-animate>
          {keyStats.map((item, index) => (
            <article key={item.title}>
              <AnimatedStat value={item.title} delay={index * 120} />
              <span>{item.text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-muted">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Как это устроено"
            title="Путь гостя от подготовки до рекомендаций"
            text="Сначала вы готовите документы и санаторно-курортную карту, в день заезда проходите первичный прием, а затем получаете индивидуальное расписание процедур."
          />
          <JourneyList items={guestJourney} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Кому подходит"
            title="Не только лечение, но и спокойная профилактика"
            text="Посмотрите, какие задачи чаще всего решают в санатории: восстановление после нагрузки, профилактика, семейная поездка или спокойный курс рядом с домом."
          />
          <div className="audience-grid">
            {audienceCards.map((item, index) => (
              <InfoTile key={item.title} item={item} animate style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Живой раздел"
            title="Мифы о санаторном лечении"
            text="Короткие ответы помогают заранее снять типовые сомнения: санаторий подходит не только после болезни, а курс строится вокруг спокойного режима, процедур и наблюдения врача."
          />
          <div className="myth-list">
            {treatmentMyths.map((item) => (
              <article key={item.myth} data-animate>
                <h3>{item.myth}</h3>
                <p>{item.reality}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ImageBand image={forestImage} title="Природа как часть восстановления" text="Ока, озеро Вырка и лесная территория помогают сделать лечение не только медицинским, но и спокойным, человеческим опытом." />
    </>
  );
}

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="О санатории"
        title={
          <>
            Лечебная база,<br />
            лесная территория<br />
            <span className="about-title-line">и опыт санаторного</span><br />
            восстановления
          </>
        }
        text="Раздел собирает историю, преимущества, инфраструктуру и то, что отличает Звездный от обычного места отдыха."
        image={getHref('/media/gallery/grounds/01.webp')}
      />
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Преимущества"
            title="Чем санаторий отличается по содержанию"
            text="Во время курса вы живете в спокойной природной среде, проходите назначения врача, придерживаетесь режима и пользуетесь инфраструктурой для восстановления."
          />
          <div>
            <CardGrid items={advantages} />
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Территория и инфраструктура"
            title="Как устроено пространство санатория"
            text="До поездки можно заранее представить основные зоны: лечебный корпус, проживание, столовую, места для активности, отдыха и семейного пребывания."
          />
          <div className="wide-grid">
            {infrastructure.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <SanatoriumGallery />
    </>
  );
}

function TreatmentPage() {
  return (
    <>
      <PageHero
        eyebrow="Лечение"
        title="Программы и профили лечения под разные задачи восстановления"
        text="Назначения зависят от санаторно-курортной карты, диагноза, показаний и противопоказаний. До заезда стоит подготовить документы и уточнить, какой формат курса вам подходит."
        image={getHref('/media/gallery/procedure-1/01.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Кому подходит"
            title="Санаторный курс начинается с задачи гостя"
            text="Начните не с выбора процедуры, а со своей задачи: восстановиться после нагрузки, пройти профилактику, поддержать ребенка или подобрать спокойный режим."
          />
          <div className="audience-grid treatment-audience">
            {treatmentAudience.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Как собирается курс"
            title="Лечение складывается из врача, режима, процедур и среды"
            text="Процедуры не выбирают как отдельные услуги из меню: врач собирает курс вокруг вашего состояния, допустимой нагрузки и целей восстановления."
          />
          <TreatmentThread items={treatmentPrinciples} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Программы"
            title="Форматы пребывания"
            text="Выберите формат, который ближе к вашей ситуации: полный заезд с проживанием, восстановительный курс или лечение без круглосуточного пребывания."
          />
          <div className="program-grid">
            {treatmentPrograms.map((program, index) => (
              <article className="program-card" key={program.title} data-animate style={getDelay(index)}>
                <span>{program.duration}</span>
                <h3>{program.title}</h3>
                <p className="program-audience">{program.audience}</p>
                <p>{program.text}</p>
                <ul>
                  {program.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Что внутри программы"
            title="Чем отличаются форматы лечения"
            text="Сравните форматы лечения: полный заезд с проживанием, восстановительный курс или курсовка без круглосуточного пребывания."
          />
          <DetailGroupGrid groups={treatmentProgramDetails} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Профили лечения"
            title="Основные медицинские направления"
            text="Профили помогают понять, с какими задачами чаще обращаются в санаторий и какие направления восстановления можно обсудить с врачом до заезда."
          />
          <DetailGroupGrid groups={treatmentProfileDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Безопасность"
            title="Показания, осторожность и вопросы до заезда"
            text="Процедуры назначает врач, а при остром состоянии, температуре или обострении поездку нужно заранее согласовать со специалистом."
          />
          <GroupedChecklist groups={treatmentSafetyGroups} />
        </div>
      </section>
      <ImageBand image={treatmentImage} title="Лечение здесь собрано вокруг спокойного режима" text="Восстановление складывается из врачебного наблюдения, процедур, питания, движения, прогулок и отдыха, а не из одной отдельной методики." />
    </>
  );
}

function ProceduresPage() {
  return (
    <>
      <PageHero
        eyebrow="Процедуры"
        title="Каталог лечебных методик и восстановительных процедур"
        text="Познакомьтесь с процедурами санатория заранее, но учитывайте: итоговый набор назначает врач после осмотра и изучения карты."
        image={getHref('/media/gallery/pool/01.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Главное"
            title="Процедуры работают как система, а не как меню услуг"
            text="Вы видите, какие возможности есть в лечебной базе, а врач подбирает из них безопасное сочетание под ваше состояние."
          />
          <div className="procedure-highlight-grid">
            {procedureHighlights.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Как назначают"
            title="От карты и осмотра к расписанию процедур"
            text="Сначала врач изучает карту и ограничения, затем подбирает процедуры и составляет расписание с учетом переносимости нагрузки."
          />
          <GuidedFlow items={procedureAssignmentFlow} label="Порядок назначения процедур" />
        </div>
      </section>
      <section className="section">
        <div className="container procedure-list">
          {procedureGroups.map((group, index) => (
            <article className="procedure-group" key={group.title} data-animate style={getDelay(index)}>
              <div>
                <span className="eyebrow">Направление</span>
                <h2>{group.title}</h2>
                <p>{group.text}</p>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Зачем назначают"
            title="Что дают разные группы процедур"
            text="Одна и та же процедура может быть полезной или лишней в зависимости от диагноза. Поэтому здесь объяснен смысл групп, а не обещан результат."
          />
          <DetailGroupGrid groups={procedurePurposeDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Ритм дня"
            title="Между процедурами обязательно остается время на восстановление"
            text="Санаторный курс не должен ощущаться марафоном. Паузы, прогулки, питание и сон так же важны, как аппаратные методики."
          />
          <div className="day-flow">
            {procedureDayFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Безопасность"
            title="Сочетаемость, подготовка и дополнительные процедуры"
            text="Перед курсом важно понимать, какие процедуры входят в назначения, где есть ограничения и какие услуги могут оплачиваться отдельно."
          />
          <GroupedChecklist groups={procedureSafetyGroups} />
        </div>
      </section>
      <SanatoriumGallery preset="procedures" />
    </>
  );
}

function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Врачи и персонал"
        title="Квалифицированная команда, которая ведет гостя по курсу лечения"
        text="Медицинская команда сопровождает вас от первичного приема и назначений до наблюдения во время курса и итоговых рекомендаций."
        image={getHref('/media/gallery/exercise-therapy/01.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Как устроено сопровождение"
            title="Команда ведет гостя от первичного приема до рекомендаций"
            text="В курсе участвуют разные специалисты: врач назначает лечение, медицинские сестры помогают с процедурами, а команда следит за самочувствием."
          />
          <div className="team-principles">
            {teamPrinciples.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <div className="staff-grid">
            {doctorProfiles.map((profile, index) => (
              <article className="staff-card" key={profile.specialty} data-animate style={getDelay(index)}>
                <h3>{profile.specialty}</h3>
                <span>{profile.role}</span>
                <p>{profile.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Маршрут гостя"
            title="Кто сопровождает курс от приема до рекомендаций"
            text="В течение курса вы встречаетесь не с одним специалистом: лечение держится на согласованной работе врача, медицинских сестер и профильных сотрудников."
          />
          <GuidedFlow items={careTeamFlow} label="Маршрут сопровождения гостя" />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Команда"
            title="Роли специалистов в санаторном курсе"
            text="Санаторный курс сопровождает команда: врач оценивает состояние, медицинские сестры помогают с процедурами, а специалисты по направлениям уточняют допустимую нагрузку."
          />
          <GroupedChecklist groups={staffRoleGroups} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Консультация"
            title="Как проходит общение со специалистом"
            text="Подготовьте медицинские документы и вопросы о самочувствии, чтобы врач мог оценить состояние и подобрать безопасный режим курса."
          />
          <DetailGroupGrid groups={doctorCardTemplate} />
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Порядок приема"
            title="Как обратиться к специалисту"
            text="Первичный прием входит в маршрут гостя, а дополнительные консультации назначаются с учетом программы лечения и состояния здоровья."
          />
          <div className="staff-request-grid">
            {staffRequests.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Подготовка к приему"
            title="Что поможет врачу точнее оценить состояние"
            text="Возьмите медицинские документы, расскажите о самочувствии и сообщите обо всех ограничениях до назначения процедур."
          />
          <GroupedChecklist groups={staffPublicationRules} />
        </div>
      </section>
    </>
  );
}

function StayPage() {
  return (
    <>
      <PageHero
        eyebrow="Проживание и питание"
        title="Спокойный режим дня, номера и лечебное питание"
        text="Узнайте, где проходит проживание, как организовано питание, что предусмотрено для детей и чем заняться после процедур."
        image={getHref('/media/gallery/room-1/01.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Как устроено пребывание"
            title="Санаторный день держится на простых вещах: сон, питание, процедуры и отдых"
            text="Санаторий — это не только номер: день складывается из процедур, питания, отдыха, прогулок и спокойного восстановления между назначениями."
          />
          <div className="stay-grid">
            {stayComfort.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Режим дня"
            title="Как проходит день между лечением, питанием и отдыхом"
            text="Заранее посмотрите, как устроен день: когда проходят процедуры, где остаются паузы, как встроены питание, прогулки и отдых."
          />
          <div className="stay-routine-grid">
            <JourneyList items={stayRoutine} />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Номера и стоимость"
            title="Номера и стоимость понятны до заезда"
            text="Перед выбором путевки проверьте формат размещения, состав услуг и официальный прейскурант."
          />
          <div className="room-grid">
            {roomNotes.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
            <a className="price-card" href={getHref('/docs/preyskurant-2026.pdf')} target="_blank" rel="noreferrer" data-animate>
              <span>PDF</span>
              <strong>Открыть прейскурант 2026</strong>
              <em>стоимость путевок, проживания и услуг</em>
            </a>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Карточки размещения"
            title="Что будет видно по номерам и путевке"
            text="Сравните категории номеров по вместимости и оснащению, проверьте возможность размещения с ребенком и состав услуг в путевке."
          />
          <DetailGroupGrid groups={roomCategoryDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container stay-meal-layout">
          <figure className="stay-meal-visual" data-animate>
            <img src={getHref('/media/gallery/dining-room/01.webp')} alt="Обеденный зал санатория" />
            <figcaption>
              <span>Столовая санатория</span>
              <strong>Питание по распорядку дня</strong>
            </figcaption>
          </figure>
          <div className="stay-meal-content">
            <SectionIntro
              eyebrow="Питание"
              title="Питание в ритме санаторного дня"
              text="Учитывайте время питания при планировании процедур. Если вам или ребенку нужен особый рацион, уточните доступные условия до оформления путевки."
            />
            <div className="stay-meal-facts">
              {mealDetails[0].rows.map((row, index) => (
                <article key={row.label} data-animate style={getDelay(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{row.label}</h3>
                  <p>{row.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Инфраструктура"
            title="Что есть на территории и как этим пользоваться"
            text="Инфраструктура разделена по задачам: лечение, питание, отдых, движение и условия для семей с детьми."
          />
          <GroupedChecklist groups={stayInfrastructureGroups} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Отдых после процедур"
            title="Свободное время тоже часть восстановления"
            text="Свободное время помогает спокойно провести день между назначениями: подвигаться, отдохнуть, почитать, провести время с семьей."
          />
          <div className="leisure-grid">
            {leisureCards.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Перед выбором"
            title="Что стоит уточнить заранее"
            text="Перед бронированием уточните бытовые детали: номер, питание, условия для детей, доступную среду и ограничения по процедурам."
          />
          <GroupedChecklist groups={stayQuestions} compact />
        </div>
      </section>
      <SanatoriumGallery preset="stay" />
      <ImageBand image={familyImage} title="После процедур остается место для отдыха" text="Бассейн, библиотека, видеозал, бильярд, настольные игры и прогулки помогают удерживать санаторный режим без ощущения больницы." />
    </>
  );
}

function PreparePage() {
  return (
    <>
      <PageHero
        eyebrow="Перед заездом"
        title="Документы, санаторно-курортная карта и правила процедур"
        text="Подготовьте документы и санаторно-курортную карту заранее. Здесь вы найдете списки для взрослых и детей, порядок заезда и правила прохождения процедур."
        image={getHref('/media/gallery/lobby/03.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Порядок подготовки"
            title="Пять шагов до спокойного курса"
            text="До поездки проверьте даты, подготовьте документы, оформите санаторно-курортную карту и заранее разберитесь, что вас ждет в первый день."
          />
          <div className="prepare-roadmap" role="list" aria-label="Пять шагов подготовки к заезду">
            {arrivalFlow.map((item, index) => (
              <article key={item.title} role="listitem" data-animate style={getDelay(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Документы"
            title="Что подготовить взрослым, детям и сопровождающим"
            text="Проверьте основные документы для взрослого, ребенка и сопровождающего, чтобы на заезде не пришлось срочно что-то досылать или оформлять."
          />
          <DocumentFlow items={documentFlow} />
          <GroupedChecklist groups={arrivalDocumentGroups} />
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Важно"
            title="Санаторно-курортная карта действует 2 месяца"
            text="Карта содержит сведения о состоянии здоровья, основном и сопутствующих заболеваниях. Чем точнее карта, тем безопаснее и полезнее назначенный курс."
          />
          <Checklist title="Правила приема процедур" items={procedureRules} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Правила пребывания"
            title="Санаторный режим, безопасность и медицинские ограничения"
            text="Во время пребывания важно соблюдать назначения, сообщать о самочувствии и помнить, что процедуры проходят только по медицинскому решению."
          />
          <div className="prepare-rules-layout">
            <article className="prepare-rules-main" data-animate>
              <div className="prepare-rule-heading">
                <span>01</span>
                <div>
                  <h2>{stayRules[0].title}</h2>
                  <p>{stayRules[0].text}</p>
                </div>
              </div>
              <ul>
                {stayRules[0].items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article className="prepare-rules-safety" data-animate style={getDelay(1)}>
              <div className="prepare-rule-heading">
                <span>02</span>
                <div>
                  <h2>{stayRules[1].title}</h2>
                  <p>{stayRules[1].text}</p>
                </div>
              </div>
              <ul>
                {stayRules[1].items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <Checklist title="Что взять с собой" items={packingList} />
          <div>
            <SectionIntro
              eyebrow="Практические подсказки"
              title="Перед поездкой стоит проверить не только документы"
              text="Проверьте связь, одежду для процедур, лекарства, документы и бытовые мелочи до выезда, чтобы на месте не отвлекаться от курса."
            />
            <div className="arrival-tips">
              {arrivalTips.map((item, index) => (
                <InfoTile key={item.title} item={item} style={getDelay(index)} />
              ))}
            </div>
            <div className="inline-actions prepare-actions" data-animate>
              <a className="button button-primary" href={getHref('/docs/grafik-zaezdov-2026.pdf')} target="_blank" rel="noreferrer">
                График заездов
              </a>
              <a className="button button-secondary" href={getHref('/docs/preyskurant-2026.pdf')} target="_blank" rel="noreferrer">
                Прейскурант
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function OmsPage() {
  return (
    <>
      <PageHero
        eyebrow="ОМС и цены"
        title="Госгарантии, платные услуги и понятные условия получения путевки"
        text="Разберитесь, чем отличаются государственные гарантии, платные услуги, курсовки и проживание, и где смотреть официальные цены."
        image={getHref('/media/gallery/lobby/05.webp')}
      />
      <section className="section">
        <div className="container two-panels">
          <article data-animate>
            <span className="eyebrow">ОМС</span>
            <h2>Информация по государственным гарантиям</h2>
            <p>
              Медицинская организация должна информировать граждан о возможности получения помощи
              в рамках программы государственных гарантий и территориальной программы.
            </p>
            <p>
              Условия получения направления и перечень документов зависят от основания поездки.
              Перед оформлением путевки уточните порядок действий по основному телефону санатория.
            </p>
          </article>
          <article data-animate style={getDelay(1)}>
            <span className="eyebrow">Платные услуги</span>
            <h2>Прейскурант 2026 и условия оплаты</h2>
            <p>
              Прейскурант 2026 доступен PDF-файлом, а основные позиции уже вынесены ниже в HTML-таблицы
              для быстрого просмотра.
            </p>
            <p>
              Рядом собраны правила предоставления платных услуг, порядок оплаты и сведения о том,
              какие процедуры могут оплачиваться дополнительно.
            </p>
            <div className="inline-actions">
              <a className="button button-primary" href={getHref('/docs/preyskurant-2026.pdf')} target="_blank" rel="noreferrer">
                Открыть прейскурант
              </a>
              <a className="button button-secondary" href={getHref('/docs/grafik-zaezdov-2026.pdf')} target="_blank" rel="noreferrer">
                График заездов
              </a>
            </div>
          </article>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro eyebrow="График заездов" title={scheduleMeta.title} text={scheduleMeta.note} />
          <ScheduleTable />
          <div className="inline-actions" data-animate>
            <a className="button button-secondary" href={getHref(scheduleMeta.href)} target="_blank" rel="noreferrer">
              Официальный график (PDF)
            </a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro eyebrow="Прейскурант 2026" title={priceMeta.title} text={priceMeta.approved} />
          <p className="source-note" data-animate>{priceMeta.note}</p>
          <PriceTables />
          <div className="inline-actions" data-animate>
            <a className="button button-primary" href={getHref(priceMeta.href)} target="_blank" rel="noreferrer">
              Официальный прейскурант (PDF)
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function OfficialPage({ onNavigate }: PageProps) {
  return (
    <>
      <PageHero
        eyebrow="Официальная информация"
        title="Документы и сведения о санатории"
        text="Здесь доступны лицензия, реквизиты учреждения, права пациента, сведения о доступной среде, оценке качества и обработке персональных данных."
        image={getHref('/media/gallery/lobby/07.webp')}
      />
      <section className="section">
        <div className="container">
          <div className="official-summary">
            {officialFacts.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <SectionIntro
            eyebrow="Основные сведения"
            title="Что можно узнать в официальном разделе"
            text="Проверьте сведения об учреждении, медицинской деятельности, документах, услугах и порядке обращений."
          />
          <div className="wide-grid">
            {officialSections.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Сведения об учреждении"
            title="Основные сведения об учреждении"
            text="Название учреждения, реквизиты, адреса, контакты, руководитель и режим работы собраны в одном месте без необходимости открывать PDF."
          />
          <DetailGroupGrid groups={institutionDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container official-license-layout">
          <div>
            <SectionIntro
              eyebrow="Лицензия"
              title="Сведения о медицинской деятельности"
              text="Ключевые сведения можно посмотреть на странице, а полные версии лицензии доступны в PDF и XML."
            />
            <DetailGroupGrid groups={licenseDetails} />
          </div>
          <div>
            <SectionIntro
              eyebrow="Перечень работ"
              title="Что указано в лицензии"
              text="Посмотрите, какие направления медицинской деятельности указаны в лицензии учреждения."
            />
            <GroupedChecklist groups={licensedWorkGroups} compact />
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Документы"
            title="Официальные документы"
            text="Откройте устав, лицензию, выписку, прейскурант или график заездов в удобном формате."
          />
          <div className="document-grid">
            {officialDocuments.map((document, index) => (
              <article key={document.title} data-animate style={getDelay(index)}>
                <div className="document-head">
                  <h3>{document.title}</h3>
                  <span>{document.fileType}</span>
                </div>
                <p>{document.text}</p>
                <small>{document.source}</small>
                <a className="document-link" href={getHref(document.href)} target="_blank" rel="noreferrer">
                  Открыть файл
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container official-service-grid">
          <div>
            <SectionIntro
              eyebrow="Пациенту"
              title="Права, обязанности и обращения"
              text="Здесь собраны права пациента, обязанности во время пребывания и контакты для обращений."
            />
            <GroupedChecklist groups={patientRightsGroups} compact />
          </div>
          <div>
            <GroupedChecklist groups={oversightContacts} compact />
            <GroupedChecklist groups={paidServiceRules} compact />
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Правовые разделы"
            title="Права гостей и открытость учреждения"
            text="Перейдите к информации о персональных данных, доступной среде, оценке качества и обращениях граждан."
          />
          <div className="legal-links">
            {legalPages.map((page, index) => (
              <button
                key={page.path}
                type="button"
                onClick={() => onNavigate(page.path)}
                data-animate
                style={getDelay(index)}
              >
                <strong>{page.label}</strong>
                <span>{page.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Новости и ЗОЖ"
        title="Жизнь санатория, объявления и полезные материалы"
        text="Новости собраны как спокойная лента: события, графики, профилактика, изменения в документах и памятки для гостей."
        image={getHref('/media/gallery/event-hall/02.webp')}
      />
      <section className="section">
        <div className="container news-grid">
          {news.map((item, index) => (
            <article className="news-card" key={item.title} data-animate style={getDelay(index)}>
              <time>{item.date}</time>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ContactsPage({ onNavigate }: PageProps) {
  const phoneHref = getPhoneHref(contacts.phone);

  return (
    <>
      <PageHero
        eyebrow="Контакты"
        title="Как связаться с санаторием и подготовить обращение"
        text="Здесь собраны способы связи, подсказки для обращения и быстрые ссылки на официальные разделы."
        image={getHref('/media/gallery/grounds/06.webp')}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Связь"
            title="Как связаться с санаторием"
            text="Выберите удобный канал связи: телефон, электронную почту или почтовый адрес для официального обращения."
          />
          <div className="contact-channel-grid">
            {contactChannels.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <div className="contact-primary-actions" data-animate>
            {phoneHref ? <a className="button button-primary" href={phoneHref}>Позвонить</a> : null}
            <a className="button button-secondary" href={`mailto:${contacts.email}`}>Написать на email</a>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Реквизиты"
            title="Официальные сведения об учреждении"
            text="Наименование, регистрационные данные и адреса собраны отдельно от способов связи — для договоров, заявлений и официальной корреспонденции."
          />
          <DetailGroupGrid groups={contactDetailGroups} />
        </div>
      </section>
      <section className="section">
        <div className="container contact-appeal-layout">
          <SectionIntro
            eyebrow="Обращение"
            title="Как написать так, чтобы ответить было проще"
            text="Следуйте простому порядку действий при отправке письма, официального обращения или запроса по документам."
          />
          <div className="contact-flow-grid">
            {contactAppealFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Сценарии"
            title="Куда направить вопрос: заезд, лечение или официальное обращение"
            text="Выберите ситуацию и приложите нужные данные: даты заезда, возраст гостей, номер путевки, медицинские документы или тему официального обращения."
          />
          <GroupedChecklist groups={contactPurposeGroups} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Что указать"
            title="Так обращение будет проще обработать"
            text="Чем точнее указаны даты, формат поездки, контакты и вопрос, тем быстрее учреждение сможет подготовить предметный ответ."
          />
          <div className="contact-tip-list">
            {contactRequestTips.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Как добраться"
            title="Уточните маршрут перед поездкой"
            text="Перед поездкой уточните у санатория адрес для навигатора, схему проезда, ближайшую остановку и точку въезда."
          />
          <div className="contact-route-grid">
            {contactRouteNotes.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Быстрые ссылки"
            title="Документы и правила рядом с контактами"
            text="Рядом с контактами доступны документы, правила заезда, цены, ОМС и правовые разделы."
          />
          <div className="contact-link-grid">
            {[
              { label: 'Документы', path: '/official' },
              { label: 'Перед заездом', path: '/prepare' },
              { label: 'ОМС и цены', path: '/oms' },
              { label: 'Персональные данные', path: '/privacy' },
              { label: 'Обращения граждан', path: '/anti-corruption' },
              { label: 'Доступная среда', path: '/accessibility' },
            ].map((item, index) => (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                data-animate
                style={getDelay(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function formatPrice(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function PriceTables() {
  return (
    <div className="price-tables">
      {priceGroups.map((group) => (
        <article className="price-block" key={group.title} data-animate>
          <h3>{group.title}</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {group.withCode ? <th className="col-code">Код</th> : null}
                  <th>Наименование</th>
                  <th className="col-unit">Ед. / период</th>
                  <th className="col-price">Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row, index) => (
                  <tr key={`${row.code ?? ''}-${row.name}-${index}`}>
                    {group.withCode ? <td className="col-code">{row.code}</td> : null}
                    <td>{row.name}</td>
                    <td className="col-unit">{row.unit}</td>
                    <td className="col-price">
                      {formatPrice(row.price)}
                      {row.vat ? <small>в т.ч. НДС {row.vat} ₽</small> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

function ScheduleTable() {
  return (
    <div className="table-scroll schedule-table" data-animate>
      <table>
        <thead>
          <tr>
            <th>Период заезда</th>
            <th className="col-days">Дней</th>
            <th>Категория путёвок</th>
          </tr>
        </thead>
        <tbody>
          {scheduleRows.map((row) => (
            <tr key={row.period}>
              <td>{row.period}</td>
              <td className="col-days">{row.days}</td>
              <td>{row.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <section className="section">
        <div className="container legal-body">
          <div className="legal-fact-grid">
            {content.facts.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          {content.sections.map((section, index) => (
            <article className="legal-section" key={section.heading} data-animate style={getDelay(index)}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list ? (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function NotFoundPage({ onNavigate }: PageProps) {
  return (
    <section className="section not-found">
      <div className="container">
        <span className="eyebrow">404</span>
        <h1>Такой страницы пока нет</h1>
        <p>Вернитесь на главную или выберите нужный раздел в навигации.</p>
        <button className="button button-primary" type="button" onClick={() => onNavigate('/')}>
          На главную
        </button>
      </div>
    </section>
  );
}

function PageHero({
  eyebrow,
  title,
  text,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
  image: string;
}) {
  return (
    <section className="page-hero page-hero-cover" style={{ backgroundImage: `url(${image})` }}>
      <div className="container page-hero-layout">
        <div className="page-hero-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{text}</p>
          <div className="page-hero-detail" aria-hidden="true">
            <span>Звездный</span>
            <span>санаторно-курортное лечение</span>
            <span>Калужская область</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="section-intro" data-animate>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function InfoTile({
  item,
  animate = true,
  style,
}: {
  item: InfoCard;
  animate?: boolean;
  style?: CSSProperties;
}) {
  return (
    <article className="info-tile" data-animate={animate ? '' : undefined} style={style}>
      {item.meta ? <span>{item.meta}</span> : null}
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </article>
  );
}

function TreatmentThread({ items }: { items: InfoCard[] }) {
  return (
    <div className="treatment-thread" aria-label="Маршрут санаторного курса">
      <svg className="treatment-thread-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 23 12 C 72 10 82 23 77 35 C 71 50 29 42 23 58 C 15 79 65 72 77 88" />
      </svg>
      {items.map((item, index) => (
        <article
          className={`treatment-thread-step treatment-thread-step-${index + 1}`}
          key={item.title}
          data-animate
          style={getDelay(index)}
        >
          <div className="treatment-thread-marker" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="treatment-thread-copy">
            {item.meta ? <span>{item.meta}</span> : null}
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function JourneyList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="journey-list">
      {items.map((item, index) => (
        <article key={item.title} data-animate style={{ '--delay': `${index * 80}ms` } as CSSProperties}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function DocumentFlow({ items }: { items: InfoCard[] }) {
  return (
    <div className="document-flow" aria-label="Порядок подготовки документов">
      {items.map((item, index) => (
        <article key={item.title} data-animate style={getDelay(index)}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function GuidedFlow({ items, label }: { items: InfoCard[]; label: string }) {
  return (
    <div className="guided-flow" aria-label={label}>
      {items.map((item, index) => (
        <article key={item.title} data-animate style={getDelay(index)}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            {item.meta ? <em>{item.meta}</em> : null}
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function CardGrid({ items }: { items: InfoCard[] | { title: string; text: string }[] }) {
  return (
    <div className="card-grid">
      {items.map((item, index) => (
        <InfoTile key={item.title} item={item} animate style={getDelay(index)} />
      ))}
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="checklist" data-animate>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function GroupedChecklist({ groups, compact = false }: { groups: ChecklistGroup[]; compact?: boolean }) {
  return (
    <div className={compact ? 'grouped-checklist grouped-checklist-compact' : 'grouped-checklist'}>
      {groups.map((group, index) => (
        <article key={group.title} className="checklist" data-animate style={getDelay(index)}>
          <h2>{group.title}</h2>
          {group.text ? <p>{group.text}</p> : null}
          <ul>
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function DetailGroupGrid({ groups }: { groups: DetailGroup[] }) {
  return (
    <div className="detail-group-grid">
      {groups.map((group, index) => (
        <article key={group.title} className="detail-group" data-animate style={getDelay(index)}>
          <h3>{group.title}</h3>
          {group.text ? <p>{group.text}</p> : null}
          <dl>
            {group.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function ImageBand({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <section className="image-band">
      <img src={image} alt="" />
      <div className="container image-band-copy" data-animate>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}

function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <footer className="footer">
      <div className="container footer-layout">
        <div className="footer-about">
          <strong>ГАУЗ Калужской области "Калужский санаторий "Звездный"</strong>
          <p>Информационный сайт санаторно-курортного учреждения.</p>
        </div>
        <div className="footer-nav" aria-label="Разделы сайта">
          {footerNavigation.map((group) => (
            <nav key={group.title} className="footer-links" aria-label={group.title}>
              <h2>{group.title}</h2>
              {group.paths.map((path) => {
                const route = routes.find((item) => item.path === path);

                if (!route) {
                  return null;
                }

                return (
                  <a
                    key={route.path}
                    href={getHref(route.path)}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(route.path);
                    }}
                  >
                    {route.label}
                  </a>
                );
              })}
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}

const pages: Record<string, (props: PageProps) => ReactElement> = {
  '/': HomePage,
  '/about': AboutPage,
  '/treatment': TreatmentPage,
  '/procedures': ProceduresPage,
  '/doctors': DoctorsPage,
  '/stay': StayPage,
  '/prepare': PreparePage,
  '/oms': OmsPage,
  '/official': OfficialPage,
  '/news': NewsPage,
  '/contacts': ContactsPage,
  ...Object.fromEntries(
    legalPages.map((content) => [content.path, () => <LegalPage content={content} />]),
  ),
};

export default App;
