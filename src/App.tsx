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
  contactPublicationChecklist,
  contactPurposeGroups,
  contactRequestTips,
  contactRouteNotes,
  careTeamFlow,
  doctorCardTemplate,
  doctorProfiles,
  guestJourney,
  homeHighlights,
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
  treatmentStages,
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const primaryNavPaths = ['/', '/about', '/treatment', '/procedures', '/doctors', '/stay', '/prepare', '/oms', '/official', '/contacts'];
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

      <nav className="container nav-grid" aria-label="Основная навигация">
        <div className="nav-row">
          {mainRoutes.map((item) => (
            <NavLink key={item.path} item={item} activePath={activePath} onNavigate={onNavigate} />
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

function EditorialNote({ children }: { children: ReactNode }) {
  return (
    <aside className="editorial-note" data-animate>
      <strong>Пометка для заказчика</strong>
      <p>{children}</p>
    </aside>
  );
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

      <section className="section section-compact">
        <div className="container feature-grid">
          {homeHighlights.map((item, index) => (
            <InfoTile key={item.title} item={item} animate style={getDelay(index)} />
          ))}
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
            text="Санаторный курс легче воспринимается, когда понятен порядок: что сделать заранее, что происходит в первый день и как назначаются процедуры."
          />
          <JourneyList items={guestJourney} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Кому подходит"
            title="Не только лечение, но и спокойная профилактика"
            text="Мы выделили типовые ситуации гостей, чтобы посетитель быстрее понял, подходит ли ему формат санатория."
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
            text="Этот блок стоит взять из материалов санатория: он делает сайт менее казенным и заранее отвечает на сомнения гостей."
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
        title="Лечебная база, лесная территория и опыт санаторного восстановления"
        text="Раздел собирает историю, преимущества, инфраструктуру и то, что отличает Звездный от обычного места отдыха."
        image={forestImage}
      />
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Преимущества"
            title="Чем санаторий отличается по содержанию"
            text="На этой странице лучше показывать не те же цифры, что на главной, а устройство места: природные факторы, медицинское сопровождение, спокойный режим и будущие визуальные материалы."
          />
          <div>
            <CardGrid items={advantages} />
            <EditorialNote>
              Для заказчика: сюда позже стоит добавить реальные фото территории, кабинетов и номеров, а затем заменить их генерациями в едином стиле.
            </EditorialNote>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Будущая галерея"
            title="Территория, кабинеты и номера должны стать визуальным доказательством"
            text="Когда будут отобраны реальные фотографии, этот блок можно превратить в спокойную галерею: территория, лечебные кабинеты, бассейн, номера, столовая и зоны отдыха."
          />
          <div className="future-gallery-grid">
            {['Территория и прогулочные маршруты', 'Лечебные кабинеты и процедуры', 'Номера и бытовые условия', 'Столовая и зоны отдыха'].map((item, index) => (
              <article key={item} data-animate style={getDelay(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item}</h3>
                <p>Место для финального изображения и короткой подписи после отбора исходных фото.</p>
              </article>
            ))}
          </div>
          <EditorialNote>
            Для заказчика: этот блок не должен остаться заглушкой в финальной версии. Его нужно заменить настоящими изображениями или генерациями по реальным фото.
          </EditorialNote>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Инфраструктура"
            title="Все для курса лечения и спокойного пребывания"
            text="Здесь важно показывать не абстрактный комфорт, а конкретные зоны: лечебный корпус, питание, движение, отдых и детский формат."
          />
          <div className="wide-grid">
            {infrastructure.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <EditorialNote>
            Для заказчика: по инфраструктуре нужны реальные фото, подтвержденные названия зон и список объектов, которые можно публиковать на сайте.
          </EditorialNote>
        </div>
      </section>
    </>
  );
}

function TreatmentPage() {
  return (
    <>
      <PageHero
        eyebrow="Лечение"
        title="Программы и профили лечения под разные задачи восстановления"
        text="Назначения зависят от санаторно-курортной карты, диагноза, показаний и противопоказаний. Сайт должен помогать гостю понять маршрут до заезда."
        image={treatmentImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Кому подходит"
            title="Санаторный курс начинается с задачи гостя"
            text="Так посетителю проще сориентироваться: не выбирать процедуру наугад, а понять, какая жизненная ситуация ближе к его запросу."
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
            text="Этот блок помогает снять главное недопонимание: санаторий не продает отдельные процедуры как меню, а собирает безопасный курс вокруг состояния гостя."
          />
          <div className="treatment-principle-grid">
            {treatmentPrinciples.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Программы"
            title="Форматы пребывания"
            text="Каждую программу позже можно раскрыть отдельной страницей с условиями, сроками, документами и составом процедур."
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
            text="Подробные карточки помогают понять, где нужен полный заезд, где восстановительный курс, а где достаточно курсовки."
          />
          <DetailGroupGrid groups={treatmentProgramDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container treatment-pathway">
          <SectionIntro
            eyebrow="Маршрут лечения"
            title="Процедуры не выбирают из списка, их назначают по состоянию"
            text="Это важно объяснять на сайте: гость видит возможности санатория, но итоговый курс формируется после приема врача и изучения санаторно-курортной карты."
          />
          <div className="pathway-grid">
            {treatmentStages.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Профили лечения"
            title="Основные медицинские направления"
            text="Каждый профиль раскрыт через задачу курса, возможные методики и ограничение. Так текст остается полезным, но не обещает медицинский результат."
          />
          <DetailGroupGrid groups={treatmentProfileDetails} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Безопасность"
            title="Показания, осторожность и вопросы до заезда"
            text="Для медицинского сайта важно заранее объяснять ограничения: процедуры назначаются врачом, а острые состояния требуют отдельной консультации."
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
        text="Раздел помогает понять, какие процедуры есть в санатории, но итоговый набор всегда назначает врач."
        image={staffImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Главное"
            title="Процедуры работают как система, а не как меню услуг"
            text="На странице важно показывать возможности санатория, но не создавать ощущение свободного выбора без врача."
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
            text="Такой маршрут помогает гостю понять, почему нельзя просто выбрать понравившуюся процедуру из списка."
          />
          <div className="procedure-flow-grid">
            {procedureAssignmentFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
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
            text="Этот блок честно отделяет возможности лечебной базы от медицинских ограничений и платных услуг."
          />
          <GroupedChecklist groups={procedureSafetyGroups} />
        </div>
      </section>
    </>
  );
}

function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Врачи и персонал"
        title="Квалифицированная команда, которая ведет гостя по курсу лечения"
        text="Раздел показывает, как медицинская команда сопровождает гостя: от первичного приема и назначений до наблюдения в ходе курса."
        image={staffImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Как устроено сопровождение"
            title="Команда ведет гостя от первичного приема до рекомендаций"
            text="Даже без персональных карточек уже можно объяснить роли специалистов и показать, почему санаторное лечение не сводится к процедурам по расписанию."
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
            text="Так посетитель понимает, что санаторное лечение держится не на одном враче, а на согласованной работе команды."
          />
          <div className="care-team-flow">
            {careTeamFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Команда"
            title="Роли специалистов в санаторном курсе"
            text="Пока нет подтвержденных персональных карточек, безопаснее объяснять роли команды и не выдумывать людей."
          />
          <GroupedChecklist groups={staffRoleGroups} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Будущие карточки"
            title="Как будут выглядеть карточки специалистов"
            text="Карточки должны быть спокойными и проверяемыми: должность, специализация, образование, квалификация, аккредитация и график приема."
          />
          <DetailGroupGrid groups={doctorCardTemplate} />
          <EditorialNote>
            Для заказчика: заполнить этот блок можно только после передачи ФИО, должностей, образования, квалификации, аккредитаций, графиков и согласий на публикацию фото.
          </EditorialNote>
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Для официальной публикации"
            title="Что нужно запросить по каждому специалисту"
            text="Для посетителя этот раздел позже должен стать обычными карточками врачей, а пока он помогает собрать данные без риска публикации неподтвержденной информации."
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
            eyebrow="Персональные данные"
            title="Публиковать врачей можно только после сверки и согласий"
            text="В финальной версии здесь должны остаться только подтвержденные публичные сведения о специалистах."
          />
          <GroupedChecklist groups={staffPublicationRules} />
          <EditorialNote>
            Для заказчика: неподтвержденные ФИО, фото и квалификацию публиковать нельзя. Нужна сверка с кадровыми документами и согласия сотрудников.
          </EditorialNote>
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
        text="Этот раздел должен отвечать на простые вопросы гостя: где жить, как кормят, что есть для детей и чем заняться после процедур."
        image={roomImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Как устроено пребывание"
            title="Санаторный день держится на простых вещах: сон, питание, процедуры и отдых"
            text="На этой странице важно не продавать номер как в отеле, а объяснить условия жизни во время курса лечения."
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
            text="Гостю важно заранее представить не только номер, но и весь ритм пребывания: когда процедуры, где паузы, как встроены питание и прогулки."
          />
          <div className="stay-routine-grid">
            {stayRoutine.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Номера и стоимость"
            title="Номера и стоимость должны быть понятны до заезда"
            text="Посетителю важно заранее увидеть формат размещения, состав путевки и официальный источник цен."
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
            title="Что нужно показать по номерам и путевке"
            text="Карточка номера должна быстро отвечать на практические вопросы: кому подходит, что внутри, сколько мест и что входит в путевку."
          />
          <DetailGroupGrid groups={roomCategoryDetails} />
          <EditorialNote>
            Для заказчика: нужны реальные категории номеров, оснащение, фотографии, доступность Wi-Fi, условия для детей и подтвержденный состав путевки.
          </EditorialNote>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Питание"
            title="Столовая и лечебное питание как часть курса"
            text="Питание в санатории стоит объяснять не как гостиничный сервис, а как часть режима: оно связано с процедурами, отдыхом и рекомендациями врача."
          />
          <DetailGroupGrid groups={mealDetails} />
          <EditorialNote>
            Для заказчика: нужны подтвержденные сведения по кратности питания, диетическим столам, детскому меню и формату обслуживания в столовой.
          </EditorialNote>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Инфраструктура"
            title="Что есть на территории и как этим пользоваться"
            text="Инфраструктура сгруппирована по задачам, чтобы посетителю было легче понять, что относится к лечению, что к отдыху, а что важно для семей."
          />
          <GroupedChecklist groups={stayInfrastructureGroups} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Отдых после процедур"
            title="Свободное время тоже часть восстановления"
            text="Досуг лучше показывать спокойным и прикладным: чем заняться между назначениями, где двигаться, где отдохнуть."
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
            title="Что лучше уточнить заранее"
            text="Этот блок помогает не потеряться в бытовых деталях: номер, питание, дети, доступная среда и ограничения по процедурам."
          />
          <GroupedChecklist groups={stayQuestions} compact />
        </div>
      </section>
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
        text="Гость должен заранее понимать, что подготовить, где оформить карту и почему врач назначает процедуры только после осмотра."
        image={documentsImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Порядок подготовки"
            title="Пять шагов до спокойного курса"
            text="Этот блок снижает тревогу перед поездкой: человек понимает, что сделать заранее, какие документы собрать и что произойдет в первый день."
          />
          <div className="arrival-step-grid arrival-flow-grid">
            {arrivalFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Документы"
            title="Что подготовить взрослым, детям и сопровождающим"
            text="Список помогает заранее проверить основные документы и понять, что может понадобиться взрослым, детям и сопровождающим."
          />
          <GroupedChecklist groups={arrivalDocumentGroups} />
          <EditorialNote>
            Для заказчика: финальные требования по детям, сопровождающим и срокам действия справок нужно сверить с администрацией перед публикацией.
          </EditorialNote>
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
            text="Такие правила есть у большинства санаториев: они помогают гостю понимать, где заканчивается отдых и начинается медицинская ответственность."
          />
          <GroupedChecklist groups={stayRules} />
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <Checklist title="Что взять с собой" items={packingList} />
          <div>
            <SectionIntro
              eyebrow="Практические подсказки"
              title="Перед поездкой лучше проверить не только документы"
              text="Эти короткие советы помогают избежать типичных проблем уже на месте."
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
        text="Раздел должен разделять бесплатную помощь по государственным гарантиям, платные услуги, курсовки и проживание."
        image={documentsImage}
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
              В финальной версии здесь должен быть простой порядок действий: кто может получить
              направление, где его оформить, какие документы подготовить и куда обратиться.
            </p>
            <EditorialNote>
              Для заказчика: нужен согласованный текст по ОМС, госгарантиям, направлению, документам и контактам ответственного сотрудника.
            </EditorialNote>
          </article>
          <article data-animate style={getDelay(1)}>
            <span className="eyebrow">Платные услуги</span>
            <h2>Прейскурант 2026 и условия оплаты</h2>
            <p>
              В материалах есть скан прейскуранта. На первом этапе его можно разместить PDF-файлом,
              затем перенести основные позиции в HTML-таблицы.
            </p>
            <p>
              Рядом должны быть правила предоставления платных услуг, порядок оплаты и сведения о
              том, какие процедуры оплачиваются дополнительно.
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
        title="Юридический и обязательный раздел для сайта госучреждения"
        text="Здесь собираются документы, лицензии, сведения о медорганизации, доступная среда, независимая оценка качества и персональные данные."
        image={documentsImage}
      />
      <section className="section">
        <div className="container">
          <div className="official-summary">
            {officialFacts.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <SectionIntro
            eyebrow="Обязательные блоки"
            title="Что должно быть опубликовано"
            text="Структура учитывает обязанности медицинской организации информировать граждан через интернет и поддерживать открытость информации."
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
            title="Короткая официальная карточка без открытия PDF"
            text="Проверяющий и гость должны быстро увидеть название, реквизиты, адреса, контакты, руководителя и режим работы без открытия PDF."
          />
          <DetailGroupGrid groups={institutionDetails} />
          <EditorialNote>
            Для заказчика: режим работы и часть должностных/контактных данных нужно подтвердить у администрации перед публикацией.
          </EditorialNote>
        </div>
      </section>
      <section className="section">
        <div className="container official-license-layout">
          <div>
            <SectionIntro
              eyebrow="Лицензия"
              title="Медицинская деятельность текстом"
              text="Ключевые сведения о лицензии вынесены на страницу, а PDF и XML остаются первоисточниками для сверки."
            />
            <DetailGroupGrid groups={licenseDetails} />
          </div>
          <div>
            <SectionIntro
              eyebrow="Перечень работ"
              title="Что указано в лицензии"
              text="Список сгруппирован для чтения, чтобы посетитель видел направления медицинской деятельности в понятном виде."
            />
            <GroupedChecklist groups={licensedWorkGroups} compact />
            <EditorialNote>
              Для заказчика: формулировки лицензии нужно сверить с медицинской частью и первоисточниками перед финальной публикацией.
            </EditorialNote>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Документы"
            title="Материалы, которые уже есть у нас"
            text="Файлы подключены к сайту и открываются из публичной папки, чтобы посетитель мог свериться с первоисточником."
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
          <EditorialNote>
            Для заказчика: перед публикацией нужно проверить актуальность дат, реквизитов и финальные формулировки официальных документов.
          </EditorialNote>
        </div>
      </section>
      <section className="section">
        <div className="container official-service-grid">
          <div>
            <SectionIntro
              eyebrow="Пациенту"
              title="Права, обязанности и обращения"
              text="Эти блоки закрывают практическую часть официального слоя: что может пациент, что обязан соблюдать и куда обращаться."
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
            title="Обязательная информация для сайта медорганизации"
            text="Здесь собраны разделы, которые помогают посетителю найти правовую информацию, сведения о доступности, качестве и обращениях."
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
        text="Новости лучше вести как спокойную ленту: события, графики, профилактика, изменения в документах и памятки для гостей."
        image={familyImage}
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
        text="Здесь собраны подтверждённые каналы связи, статус данных, подсказки для обращения и быстрые ссылки на официальные разделы."
        image={forestImage}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Связь"
            title="Контакты из официальных материалов"
            text="Телефон, email и почтовый адрес перенесены из реквизитов учреждения, чтобы посетитель мог быстро выбрать удобный канал связи."
          />
          <div className="contact-channel-grid">
            {contactChannels.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <EditorialNote>
            Для заказчика: режим работы, разделение телефонов по отделам и порядок приема обращений нужно подтвердить отдельно.
          </EditorialNote>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionIntro
            eyebrow="Реквизиты"
            title="Проверенные контакты и адреса лучше разделить по смыслу"
            text="У учреждения есть контакты для связи и отдельные адресные формулировки в официальных документах. На странице они разведены, чтобы посетитель понимал, что использовать для письма, звонка и маршрута."
          />
          <DetailGroupGrid groups={contactDetailGroups} />
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Обращение"
            title="Как написать так, чтобы ответить было проще"
            text="Вместо одной общей подсказки показываем простой порядок действий. Он подходит для письма на email, официального обращения или запроса по документам."
          />
          <div className="contact-flow-grid">
            {contactAppealFlow.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container contact-layout">
          <article className="contact-panel" data-animate>
            <h2>Быстрая связь</h2>
            {phoneHref ? <a href={phoneHref}>{contacts.phone}</a> : <span className="contact-status">{contacts.phone}</span>}
            <span>Дополнительный телефон: {contacts.phoneExtra}</span>
            <span>Факс: {contacts.fax}</span>
            <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            <p>{contacts.address}</p>
            <span>{contacts.note}</span>
          </article>
          <article className="contact-panel" data-animate style={getDelay(1)}>
            <h2>Официальные обращения</h2>
            <p>
              Для обращений указаны телефон, email и почтовый адрес учреждения. Посетителю важно
              сразу понимать, какие данные приложить и как сформулировать запрос.
            </p>
            <p>
              Форма обратной связи пока не добавляется: для неё нужен согласованный способ приема
              заявок и правила обработки персональных данных.
            </p>
            <div className="contact-action-list">
              <button type="button" onClick={() => window.location.href = `mailto:${contacts.email}`}>
                Написать на email
              </button>
              <button type="button" onClick={() => onNavigate('/privacy')}>
                Персональные данные
              </button>
            </div>
          </article>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Сценарии"
            title="Куда направить вопрос: заезд, лечение или официальное обращение"
            text="Посетителю не нужно угадывать, как описать запрос. Раздел подсказывает, какие данные приложить в зависимости от ситуации."
          />
          <GroupedChecklist groups={contactPurposeGroups} />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Что указать"
            title="Так обращение будет проще обработать"
            text="Короткие подсказки помогают человеку написать не абстрактное письмо, а запрос, на который учреждению легче ответить."
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
            title="Маршрут лучше показывать только после подтверждения"
            text="Чтобы посетитель не ошибся с дорогой, на сайте должен быть один согласованный адрес для навигатора и понятная схема проезда."
          />
          <div className="contact-route-grid">
            {contactRouteNotes.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
          <EditorialNote>
            Для заказчика: нужно подтвердить адрес для навигатора, точку въезда, ближайшую остановку, расстояние от Калуги и схему проезда.
          </EditorialNote>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container customer-zone">
          <SectionIntro
            eyebrow="Для заказчика"
            title="Какие контактные данные ещё нужны от администрации"
            text="Этот блок помогает не потерять важные официальные детали: режим работы, точные маршруты, разделение телефонов и регламент обращений."
          />
          <GroupedChecklist groups={contactPublicationChecklist} compact />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Быстрые ссылки"
            title="Документы и правила рядом с контактами"
            text="Контактная страница должна помогать не только написать письмо, но и сразу найти официальную информацию."
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
          <EditorialNote>
            Для заказчика: эти разделы пока подготовлены как структура. Нужны юридическая сверка и подстановка реальных данных учреждения.
          </EditorialNote>
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
          <aside className="legal-note" data-animate>
            <strong>Пометка для заказчика</strong>
            <p>{content.reviewNote}</p>
          </aside>
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
          <GroupedChecklist groups={content.nextSteps} compact />
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
  title: string;
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
