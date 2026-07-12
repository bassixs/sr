import { useEffect, useState } from 'react';

export type GalleryImage = {
  src: string;
  thumb: string;
  width: number;
  height: number;
};

export type GalleryCategory = {
  id: string;
  title: string;
  images: GalleryImage[];
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function mediaHref(path: string) {
  return `${basePath}${path}`;
}

function useGallery() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(mediaHref('/media/gallery/manifest.json'))
      .then((response) => {
        if (!response.ok) throw new Error('Не удалось загрузить фотогалерею');
        return response.json() as Promise<GalleryCategory[]>;
      })
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}

export function PhotoShowcase({
  categoryIds,
  eyebrow,
  title,
  text,
  onOpenGallery,
}: {
  categoryIds: string[];
  eyebrow: string;
  title: string;
  text: string;
  onOpenGallery: () => void;
}) {
  const categories = useGallery().filter((category) => categoryIds.includes(category.id));

  if (!categories.length) return null;

  return (
    <section className="section photo-showcase">
      <div className="container">
        <div className="photo-showcase-head" data-animate>
          <div className="section-intro">
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <button className="button button-secondary" type="button" onClick={onOpenGallery}>Все фотографии</button>
        </div>
        <div className="photo-showcase-grid">
          {categories.slice(0, 4).map((category) => (
            <button key={category.id} type="button" onClick={onOpenGallery}>
              <img src={mediaHref(category.images[0].thumb)} alt={category.title} loading="lazy" width={category.images[0].width} height={category.images[0].height} />
              <span><strong>{category.title}</strong><small>{category.images.length} фото</small></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryPage() {
  const categories = useGallery();
  const [activeId, setActiveId] = useState('grounds');
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const activeCategory = categories.find((category) => category.id === activeId) ?? categories[0];

  useEffect(() => {
    if (activeImage === null || !activeCategory) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
      if (event.key === 'ArrowRight') setActiveImage((activeImage + 1) % activeCategory.images.length);
      if (event.key === 'ArrowLeft') setActiveImage((activeImage - 1 + activeCategory.images.length) % activeCategory.images.length);
    };
    document.body.classList.add('gallery-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('gallery-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeCategory, activeImage]);

  const chooseCategory = (id: string) => {
    setActiveId(id);
    setActiveImage(null);
    window.requestAnimationFrame(() => document.querySelector('#gallery-photos')?.scrollIntoView({ behavior: 'smooth' }));
  };

  return (
    <>
      <section className="page-hero page-hero-cover" style={{ backgroundImage: `url(${mediaHref('/media/gallery/grounds/02.webp')})` }}>
        <div className="container page-hero-layout">
          <div className="page-hero-card">
            <span className="eyebrow">Фотогалерея</span>
            <h1>Посмотрите санаторий до поездки</h1>
            <p>Территория, номера, лечебные кабинеты, бассейн, столовая и пространства для отдыха собраны по разделам. Откройте кадр, чтобы рассмотреть его крупнее.</p>
            <div className="page-hero-detail" aria-hidden="true"><span>Звездный</span><span>санаторно-курортное лечение</span><span>Калужская область</span></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-intro" data-animate><span className="eyebrow">Все пространства</span><h2>Выберите, что хотите посмотреть</h2><p>Фотографии сгруппированы по помещениям и направлениям, чтобы нужное место находилось без долгой прокрутки.</p></div>
          {categories.length ? <div className="gallery-category-grid">{categories.map((category) => (
            <button key={category.id} type="button" onClick={() => chooseCategory(category.id)}><img src={mediaHref(category.images[0].thumb)} alt="" loading="lazy" width="720" height="480" /><span><strong>{category.title}</strong><small>{category.images.length} фото</small></span></button>
          ))}</div> : <p className="gallery-loading">Фотографии загружаются…</p>}
        </div>
      </section>
      {activeCategory ? <section className="section section-muted" id="gallery-photos"><div className="container">
        <div className="gallery-toolbar"><div className="section-intro" data-animate><span className="eyebrow">Выбранный раздел</span><h2>{activeCategory.title}</h2><p>{activeCategory.images.length} фото в этом разделе</p></div><label><span>Другой раздел</span><select value={activeCategory.id} onChange={(event) => chooseCategory(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label></div>
        <div className="photo-grid">{activeCategory.images.map((image, index) => <button key={image.src} type="button" onClick={() => setActiveImage(index)} aria-label={`Открыть фото ${index + 1}: ${activeCategory.title}`}><img src={mediaHref(image.thumb)} alt={`${activeCategory.title}, фото ${index + 1}`} loading="lazy" width={image.width} height={image.height} /></button>)}</div>
      </div></section> : null}
      {activeCategory && activeImage !== null ? <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${activeCategory.title}, фото ${activeImage + 1}`} onClick={() => setActiveImage(null)}>
        <button className="lightbox-close" type="button" onClick={() => setActiveImage(null)} aria-label="Закрыть">×</button>
        <button className="lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage - 1 + activeCategory.images.length) % activeCategory.images.length); }} aria-label="Предыдущее фото">‹</button>
        <figure onClick={(event) => event.stopPropagation()}><img src={mediaHref(activeCategory.images[activeImage].src)} alt={`${activeCategory.title}, фото ${activeImage + 1}`} /><figcaption>{activeCategory.title} · {activeImage + 1} из {activeCategory.images.length}</figcaption></figure>
        <button className="lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage + 1) % activeCategory.images.length); }} aria-label="Следующее фото">›</button>
      </div> : null}
    </>
  );
}
