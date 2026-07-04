import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import heroImage from '../photo/1.webp';
import forestImage from '../photo/2.webp';
import treatmentImage from '../photo/3.webp';
import roomImage from '../photo/4.webp';
import familyImage from '../photo/5.webp';
import staffImage from '../photo/6.webp';
import documentsImage from '../photo/7.webp';
import {
  advantages,
  arrivalDocuments,
  arrivalSteps,
  arrivalTips,
  audienceCards,
  contacts,
  doctorProfiles,
  guestJourney,
  homeHighlights,
  infrastructure,
  keyStats,
  leisureCards,
  news,
  officialDocuments,
  officialFacts,
  officialSections,
  procedureGroups,
  procedureDayFlow,
  procedureHighlights,
  procedureRules,
  packingList,
  roomNotes,
  routes,
  staffRequests,
  stayComfort,
  teamPrinciples,
  treatmentMyths,
  treatmentAudience,
  treatmentProfiles,
  treatmentPrograms,
  treatmentStages,
  legalPages,
  type InfoCard,
  type LegalPageContent,
} from './content';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const primaryNavPaths = ['/', '/about', '/treatment', '/procedures', '/doctors', '/stay', '/prepare', '/oms', '/official', '/contacts'];
const heroFacts = ['40+ лет опыта', '150 коек', 'дети с 4 лет'];

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  useEffect(() => {
    const siteTitle = 'Калужский санаторий Звездный — официальный информационный сайт';
    const route = routes.find((item) => item.path === currentPath);
    document.title = route && currentPath !== '/' ? `${route.label} — Калужский санаторий Звездный` : siteTitle;
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
      <main id="main-content">
        <Page onNavigate={navigate} />
      </main>
      <Footer onNavigate={navigate} />
    </div>
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
          <a className="phone-link" href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`}>
            {contacts.phone}
          </a>
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

function HomePage({ onNavigate }: PageProps) {
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

      <section className="section section-stats">
        <div className="container stat-ribbon" data-animate>
          {keyStats.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container split-layout">
          <SectionIntro
            eyebrow="С чего начать"
            title="Три быстрых пути по сайту"
            text="Если вы впервые на сайте, двигайтесь по этим трём шагам: сначала оцените место, затем лечение, затем практические условия поездки."
          />
          <div className="visit-flow">
            <button type="button" onClick={() => onNavigate('/about')} data-animate style={getDelay(0)}>
              <span>01</span>
              <strong>Понять место</strong>
              <em>территория, инфраструктура, питание и отдых</em>
            </button>
            <button type="button" onClick={() => onNavigate('/treatment')} data-animate style={getDelay(1)}>
              <span>02</span>
              <strong>Разобраться в лечении</strong>
              <em>программы, профили, процедуры, врачи</em>
            </button>
            <button type="button" onClick={() => onNavigate('/prepare')} data-animate style={getDelay(2)}>
              <span>03</span>
              <strong>Подготовить поездку</strong>
              <em>документы, ОМС, цены и правила заезда</em>
            </button>
          </div>
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
            title="Почему гости выбирают Звездный"
            text="Эти тезисы взяты из буклетов и презентационных материалов. Формулировки можно уточнить перед публикацией."
          />
          <CardGrid items={advantages} />
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
            text="Формулировки должны оставаться информирующими: без обещаний результата и с акцентом на назначение врача."
          />
          <CardGrid items={treatmentProfiles} />
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
    </>
  );
}

function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Врачи и персонал"
        title="Квалифицированная команда, которая ведет гостя по курсу лечения"
        text="Для обязательного раздела нужны ФИО, должности, образование, квалификация, сертификаты или аккредитация и график приема."
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
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Для официальной публикации"
            title="Что нужно запросить по каждому специалисту"
            text="Этот блок можно оставить как внутреннюю карту подготовки: он показывает, какие данные нужны для обязательного раздела сайта медорганизации."
          />
          <div className="staff-request-grid">
            {staffRequests.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
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
        <div className="container split-layout">
          <SectionIntro
            eyebrow="Номера и стоимость"
            title="Категории размещения нужно сверить по прейскуранту"
            text="Пока на сайте лучше честно показать структуру будущей карточки номера и дать ссылку на официальный PDF с ценами."
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
            title="Три шага до спокойного заезда"
            text="Этот блок снижает тревогу перед поездкой: человек понимает, что сделать заранее и что произойдет в первый день."
          />
          <div className="arrival-step-grid">
            {arrivalSteps.map((item, index) => (
              <InfoTile key={item.title} item={item} style={getDelay(index)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container docs-layout">
          <Checklist title="Взрослому" items={arrivalDocuments.adult} />
          <Checklist title="Ребенку" items={arrivalDocuments.child} />
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
              Для публикации нужен согласованный текст: кто имеет право на направление, где его
              получить, какие документы нужны и куда звонить.
            </p>
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
            eyebrow="Документы"
            title="Материалы, которые уже есть у нас"
            text="Файлы подключены к сайту и открываются из публичной папки. Перед публикацией останется сверить актуальность дат, реквизитов и согласовать финальные формулировки."
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
        <div className="container">
          <SectionIntro
            eyebrow="Правовые разделы"
            title="Обязательная информация для сайта медорганизации"
            text="Разделы подготовлены как заготовки: структура готова, тексты требуют юридической сверки и подстановки реальных данных учреждения."
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

function ContactsPage() {
  return (
    <>
      <PageHero
        eyebrow="Контакты"
        title="Как связаться с санаторием и подготовить обращение"
        text="Контакты сейчас оставлены временными. Их нужно заменить данными из реквизитов и официальных документов."
        image={forestImage}
      />
      <section className="section">
        <div className="container contact-layout">
          <article className="contact-panel" data-animate>
            <h2>Связь</h2>
            <a href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`}>{contacts.phone}</a>
            <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            <p>{contacts.address}</p>
            <span>{contacts.note}</span>
          </article>
          <article className="contact-panel" data-animate style={getDelay(1)}>
            <h2>Для обращений</h2>
            <p>
              Если на сайте появится форма обратной связи, рядом нужны политика обработки
              персональных данных и отдельное согласие на обработку.
            </p>
            <p>
              Для официальных обращений лучше также дать почтовый адрес, email учреждения и
              ссылку на порядок рассмотрения обращений граждан.
            </p>
          </article>
        </div>
      </section>
    </>
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
          <p className="legal-note" data-animate>{content.reviewNote}</p>
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
        <div>
          <strong>ГАУЗ Калужской области "Калужский санаторий "Звездный"</strong>
          <p>Информационный сайт санаторно-курортного учреждения.</p>
        </div>
        <div className="footer-links">
          {routes
            .filter((route) => route.group === 'official')
            .map((route) => (
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
