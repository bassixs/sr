import { useEffect, useMemo, useRef, useState } from 'react';

type GalleryImage = { src: string; thumb: string; width: number; height: number };
type GalleryCategory = { id: string; title: string; images: GalleryImage[] };
type GalleryPreset = 'about' | 'procedures' | 'stay';
type GalleryFilter = { id: string; label: string; match: (id: string) => boolean };
type GalleryDisplayImage = GalleryImage & { category: string };

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const mediaHref = (path: string) => `${basePath}${path}`;

const treatmentIds = ['pool', 'exercise-therapy', 'massage', 'medical-room', 'mineral-water', 'phyto-sauna', 'psychologist'];
const leisureIds = ['library', 'billiards', 'playroom', 'cinema', 'table-tennis', 'event-hall'];

const presets: Record<GalleryPreset, { eyebrow: string; title: string; text: string; order: string[]; previewOrder: string[]; filters: GalleryFilter[] }> = {
  about: {
    eyebrow: 'Фотографии санатория',
    title: 'Посмотрите «Звездный» до поездки',
    text: 'Территория, номера, лечебные кабинеты и пространства для отдыха — в одной живой визуальной истории.',
    order: ['grounds', 'room-1', 'room-2', 'procedure-1', 'dining-room', 'library', 'lobby', 'event-hall', 'pool'],
    previewOrder: ['grounds', 'room-1', 'procedure-1', 'dining-room', 'library'],
    filters: [
      { id: 'all', label: 'Все пространства', match: () => true },
      { id: 'grounds', label: 'Территория', match: (id) => ['grounds', 'lobby', 'event-hall'].includes(id) },
      { id: 'rooms', label: 'Номера', match: (id) => id.startsWith('room-') },
      { id: 'treatment', label: 'Лечение', match: (id) => id.startsWith('procedure-') || treatmentIds.includes(id) },
      { id: 'food', label: 'Питание', match: (id) => id === 'dining-room' },
      { id: 'leisure', label: 'Отдых', match: (id) => leisureIds.includes(id) },
    ],
  },
  procedures: {
    eyebrow: 'Лечебная база',
    title: 'Посмотрите процедурные кабинеты',
    text: 'Фотографии помогают заранее представить кабинеты, оборудование и спокойную обстановку лечебного корпуса.',
    order: ['procedure-1', 'exercise-therapy', 'massage', 'pool', 'phyto-sauna'],
    previewOrder: ['procedure-1', 'exercise-therapy', 'massage', 'pool', 'phyto-sauna'],
    filters: [
      { id: 'all', label: 'Все кабинеты', match: (id) => id.startsWith('procedure-') || treatmentIds.includes(id) },
      { id: 'exercise', label: 'ЛФК', match: (id) => id === 'exercise-therapy' },
      { id: 'massage', label: 'Массаж', match: (id) => id === 'massage' },
      { id: 'pool', label: 'Бассейн', match: (id) => id === 'pool' },
      { id: 'sauna', label: 'Фитосауна', match: (id) => id === 'phyto-sauna' },
    ],
  },
  stay: {
    eyebrow: 'Проживание в санатории',
    title: 'Номера, территория и отдых',
    text: 'Посмотрите условия размещения, прогулочные зоны, столовую и пространства для свободного времени.',
    order: ['room-1', 'room-2', 'grounds', 'dining-room', 'library', 'event-hall', 'billiards', 'playroom'],
    previewOrder: ['room-1', 'grounds', 'dining-room', 'library', 'event-hall'],
    filters: [
      { id: 'all', label: 'Все пространства', match: (id) => id.startsWith('room-') || ['grounds', 'dining-room', ...leisureIds].includes(id) },
      { id: 'rooms', label: 'Номера', match: (id) => id.startsWith('room-') },
      { id: 'grounds', label: 'Территория', match: (id) => id === 'grounds' },
      { id: 'food', label: 'Столовая', match: (id) => id === 'dining-room' },
      { id: 'leisure', label: 'Отдых', match: (id) => leisureIds.includes(id) },
    ],
  },
};

function sortByOrder(items: GalleryCategory[], order: string[]) {
  return [...items].sort((left, right) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
  });
}

function interleaveImages(categories: GalleryCategory[], limit: number) {
  const result: GalleryDisplayImage[] = [];
  const maxLength = Math.max(0, ...categories.map((category) => category.images.length));

  for (let imageIndex = 0; imageIndex < maxLength && result.length < limit; imageIndex += 1) {
    for (const category of categories) {
      const image = category.images[imageIndex];
      if (image) result.push({ ...image, category: category.title });
      if (result.length === limit) break;
    }
  }

  return result;
}

function useGallery() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(mediaHref('/media/gallery/manifest.json'))
      .then((response) => response.ok ? response.json() as Promise<GalleryCategory[]> : Promise.reject())
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);
  return categories;
}

export function SanatoriumGallery({ preset = 'about' }: { preset?: GalleryPreset }) {
  const categories = useGallery();
  const config = presets[preset];
  const [filter, setFilter] = useState('all');
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedFilter = config.filters.find((item) => item.id === filter) ?? config.filters[0];
  const availableCategories = useMemo(() => sortByOrder(categories.filter((category) => config.filters[0].match(category.id)), config.order), [categories, config]);
  const selectedCategories = useMemo(() => sortByOrder(categories.filter((category) => selectedFilter.match(category.id)), config.order), [categories, selectedFilter, config]);
  const images = useMemo(() => selectedCategories.flatMap((category) => category.images.map((image) => ({ ...image, category: category.title }))), [selectedCategories]);
  const previewCategories = useMemo(
    () => filter === 'all' ? sortByOrder(selectedCategories, config.previewOrder) : selectedCategories,
    [filter, selectedCategories, config],
  );
  const preview = useMemo(
    () => interleaveImages(previewCategories, 5).map((image) => ({
      ...image,
      imageIndex: images.findIndex((item) => item.src === image.src),
    })),
    [previewCategories, images],
  );

  const closeLightbox = () => {
    setActiveImage(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const openLightbox = (index: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setActiveImage(index);
  };

  useEffect(() => {
    if (activeImage === null || !images.length) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') setActiveImage((activeImage + 1) % images.length);
      if (event.key === 'ArrowLeft') setActiveImage((activeImage - 1 + images.length) % images.length);
    };
    document.body.classList.add('gallery-open');
    window.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.classList.remove('gallery-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeImage, images]);

  if (!categories.length) return null;

  return (
    <section className="section about-gallery" aria-labelledby="about-gallery-title">
      <div className="container">
        <div className="about-gallery-heading">
          <div>
            <span className="eyebrow">{config.eyebrow}</span>
            <h2 id="about-gallery-title">{config.title}</h2>
            <p>{config.text}</p>
          </div>
          <span className="about-gallery-count">{availableCategories.reduce((total, category) => total + category.images.length, 0)} фотографий</span>
        </div>

        <div className="about-gallery-filters" role="group" aria-label="Категории фотографий">
          {config.filters.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? 'is-active' : undefined} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setActiveImage(null); setShowAll(false); }}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="about-gallery-mosaic">
          {preview.map((image, index) => (
            <button key={`${image.src}-${index}`} className={`about-gallery-tile tile-${index + 1}`} type="button" onClick={(event) => openLightbox(image.imageIndex, event.currentTarget)} aria-label={`Открыть фото: ${image.category}`}>
              <img src={mediaHref(image.thumb)} alt={image.category} loading="lazy" width={image.width} height={image.height} />
              <span><strong>{image.category}</strong>{index === 4 && images.length > 5 ? <small>Ещё {images.length - 5} фото</small> : null}</span>
            </button>
          ))}
        </div>
        {images.length > 5 ? (
          <div className="about-gallery-more-wrap">
            <button className="button button-secondary about-gallery-more" type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Скрыть дополнительные фото' : `Показать все ${images.length} фото`}
            </button>
          </div>
        ) : null}
        {showAll ? (
          <div className="about-gallery-all-grid">
            {images.map((image, index) => (
              <button key={`all-${image.src}-${index}`} type="button" onClick={(event) => openLightbox(index, event.currentTarget)} aria-label={`Открыть фото: ${image.category}`}>
                <img src={mediaHref(image.thumb)} alt={image.category} loading="lazy" width={image.width} height={image.height} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {activeImage !== null && images[activeImage] ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${images[activeImage].category}, фото ${activeImage + 1}`} onClick={closeLightbox}>
          <button ref={closeButtonRef} className="lightbox-close" type="button" onClick={closeLightbox} aria-label="Закрыть">×</button>
          <button className="lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage - 1 + images.length) % images.length); }} aria-label="Предыдущее фото">‹</button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={mediaHref(images[activeImage].src)} alt={images[activeImage].category} />
            <figcaption>{images[activeImage].category} · {activeImage + 1} из {images.length}</figcaption>
          </figure>
          <button className="lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); setActiveImage((activeImage + 1) % images.length); }} aria-label="Следующее фото">›</button>
        </div>
      ) : null}
    </section>
  );
}
