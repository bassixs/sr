import { useEffect } from 'react';
import heroImage from '../photo/1.png';
import forestImage from '../photo/2.png';
import treatmentImage from '../photo/3.png';
import roomImage from '../photo/4.png';
import familyImage from '../photo/5.png';
import staffImage from '../photo/6.png';
import documentsImage from '../photo/7.png';
import {
  benefits,
  documents,
  faq,
  navItems,
  news,
  rooms,
  treatmentPrograms,
} from './content';

const programImages = [treatmentImage, staffImage, familyImage];

function App() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.14 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href="#top" aria-label="Калужский санаторий Звездный">
            <span className="brand-mark">З</span>
            <span>
              <strong>Звездный</strong>
              <small>Калужский санаторий</small>
            </span>
          </a>

          <nav className="nav" aria-label="Основная навигация">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="topbar-phone" href="tel:+70000000000">
            +7 (000) 000-00-00
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="kicker">Лечебно-оздоровительный комплекс</span>
              <h1>Восстановление и отдых в лесной тишине рядом с Калугой</h1>
              <p>
                Санаторий для спокойного лечения, профилактики и перезагрузки: чистый воздух, река
                рядом, врачебное сопровождение и понятные программы пребывания.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#treatment">
                  Подобрать программу
                </a>
                <a className="button button-light" href="#contacts">
                  Связаться с санаторием
                </a>
              </div>
            </div>

            <aside className="hero-media">
              <img src={heroImage} alt="Санаторий Звездный среди лесной территории" />
              <div className="hero-note">
                <strong>12 км от города</strong>
                <span>лесной массив, прогулочные маршруты и река в шаговой доступности</span>
              </div>
            </aside>
          </div>

          <div className="container stats-strip" aria-label="Ключевые преимущества">
            {benefits.map((benefit) => (
              <article key={benefit.title} data-reveal>
                <span>{benefit.value}</span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container two-column">
            <div className="section-title" data-reveal>
              <span className="kicker">О санатории</span>
              <h2>Медицинская забота без ощущения больницы</h2>
            </div>
            <div className="text-panel" data-reveal>
              <img
                className="panel-image"
                src={forestImage}
                alt="Лесная прогулочная зона рядом с санаторием"
              />
              <p>
                ГАУЗ Калужской области «Калужский санаторий «Звездный» — место для восстановления,
                профилактики и отдыха в природной среде.
              </p>
              <p>
                Мы делаем акцент на понятном маршруте гостя: консультация, индивидуальный план,
                процедуры, режим дня и спокойное проживание.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="treatment">
          <div className="container">
            <div className="section-head centered" data-reveal>
              <span className="kicker">Лечение</span>
              <h2>Программы под разные задачи восстановления</h2>
              <p>Карточки можно расширить ценами, сроками, показаниями и списком процедур.</p>
            </div>

            <div className="program-grid">
              {treatmentPrograms.map((program, index) => (
                <article className="program-card" key={program.title} data-reveal>
                  <img
                    className="program-image"
                    src={programImages[index]}
                    alt={`Иллюстрация программы: ${program.title}`}
                  />
                  <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
                  <h3>{program.title}</h3>
                  <p>{program.text}</p>
                  <div className="tags">
                    {program.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section rooms-section" id="rooms">
          <div className="container rooms-grid">
            <div className="room-visual" data-reveal>
              <img src={roomImage} alt="Уютный номер санатория с видом на лес" />
            </div>
            <div data-reveal>
              <span className="kicker">Проживание</span>
              <h2>Спокойные номера для курса лечения и отдыха</h2>
              <div className="room-list">
                {rooms.map((room) => (
                  <article key={room.title}>
                    <h3>{room.title}</h3>
                    <p>{room.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section info-section" id="documents">
          <div className="container info-grid">
            <div className="section-title" data-reveal>
              <span className="kicker">Перед заездом</span>
              <h2>Документы, ОМС и важные инструкции</h2>
              <p>
                Блок собран так, чтобы посетитель быстро понял, что подготовить и куда обратиться.
              </p>
              <img
                className="section-image"
                src={documentsImage}
                alt="Регистрация и оформление документов в санатории"
              />
            </div>
            <div className="document-list">
              {documents.map((item) => (
                <article key={item} data-reveal>
                  <span></span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section news-section" id="news">
          <div className="container">
            <div className="section-head" data-reveal>
              <span className="kicker">Новости</span>
              <h2>Объявления и события санатория</h2>
            </div>
            <div className="news-grid">
              {news.map((item) => (
                <article className="news-card" key={item.title} data-reveal>
                  <time>{item.date}</time>
                  <h3>{item.title}</h3>
                  <a href="#contacts">Подробнее</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container faq-grid">
            <div className="section-title" data-reveal>
              <span className="kicker">Вопросы</span>
              <h2>Что важно знать перед поездкой</h2>
            </div>
            <div className="faq-list">
              {faq.map((item) => (
                <details key={item.question} data-reveal>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contacts">
          <div className="container contact-card" data-reveal>
            <div>
              <span className="kicker">Контакты</span>
              <h2>Поможем подобрать программу и подготовить документы</h2>
              <p>Контактные данные сейчас временные, их нужно заменить перед публикацией.</p>
            </div>
            <div className="contact-actions">
              <a className="button button-primary" href="tel:+70000000000">
                +7 (000) 000-00-00
              </a>
              <a className="button button-light" href="mailto:info@example.ru">
                info@example.ru
              </a>
              <span>Калужская область, лесной массив в 12 км от города</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p>ГАУЗ Калужской области «Калужский санаторий «Звездный»</p>
          <a href="#top">Наверх</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
