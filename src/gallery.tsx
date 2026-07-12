import { useEffect, useMemo, useState } from 'react';

type GalleryImage = { src: string; thumb: string; width: number; height: number };
type GalleryCategory = { id: string; title: string; images: GalleryImage[] };
type GalleryFilter = 'all' | 'grounds' | 'rooms' | 'treatment' | 'food' | 'leisure';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const mediaHref = (path: string) => `${basePath}${path}`;

const filters: { id: GalleryFilter; label: string; match: (id: string) => boolean }[] = [
  { id: 'all', label: 'Все пространства', match: () => true },
  { id: 'grounds', label: 'Территория', match: (id) => ['grounds', 'lobby', 'event-hall'].includes(id) },
  { id: 'rooms', label: 'Номера', match: (id) => id.startsWith('room-') },
  { id: 'treatment', label: 'Лечение', match: (id) => id.startsWith('procedure-') || ['pool', 'exercise-therapy', 'massage', 'medical-room', 'mineral-water', 'phyto-sauna', 'psychologist'].includes(id) },
  { id: 'food', label: 'Питание', match: (id) => id === 'dining-room' },
  { id: 'leisure', label: 'Отдых', match: (id) => ['library', 'billiards', 'playroom', 'cinema', 'table-tennis', 'event-hall'].includes(id) },
];

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

export function SanatoriumGallery() {
  const categories = useGallery();
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const selectedFilter = filters.find((item) => item.id === filter) ?? filters[0];
  const selectedCategories = useMemo(() => categories.filter((category) => selectedFilter.match(category.id)), [categories, selectedFilter]);
  const images = useMemo(() => selectedCategories.flatMap((category) => category.images.map((image) => ({ ...image, category: category.title }))), [selectedCategories]);
  const preview = images.slice(0, 5);

  useEffect(() => {
    if (activeImage === null || !images.length) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
      if (event.key === 'ArrowRight') setActiveImage((activeImage + 1) % images.length);
      if (event.key === 'ArrowLeft') setActiveImage((activeImage - 1 + images.length) % images.length);
    };
    document.body.classList.add('gallery-open');
    window.addEventListener('keydown', onKeyDown);
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
            <span className="eyebrow">Фотографии санатория</span>
            <h2 id="about-gallery-title">Посмотрите «Звездный» до поездки</h2>
            <p>Территория, номера, лечебные кабинеты и пространства для отдыха — в одной живой визуальной истории.</p>
          </div>
          <span className="about-gallery-count">{categories.reduce((total, category) => total + category.images.length, 0)} фотографий</span>
        </div>

        <div className="about-gallery-filters" role="group" aria-label="Категории фотографий">
          {filters.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? 'is-active' : undefined} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setActiveImage(null); }}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="about-gallery-mosaic">
          {preview.map((image, index) => (
            <button key={`${image.src}-${index}`} className={`about-gallery-tile tile-${index + 1}`} type="button" onClick={() => setActiveImage(index)} aria-label={`Открыть фото: ${image.category}`}>
              <img src={mediaHref(image.thumb)} alt={image.category} loading="lazy" width={image.width} height={image.height} />
              <span><strong>{image.category}</strong>{index === 4 && images.length > 5 ? <small>Ещё {images.length - 5} фото</small> : null}</span>
            </button>
          ))}
        </div>
      </div>

      {activeImage !== null && images[activeImage] ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${images[activeImage].category}, фото ${activeImage + 1}`} onClick={() => setActiveImage(null)}>
          <button className="lightbox-close" type="button" onClick={() => setActiveImage(null)} aria-label="Закрыть">×</button>
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
