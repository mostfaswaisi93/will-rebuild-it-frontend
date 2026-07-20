import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

/** Gaza Strip centroid — sensible default view when no center is supplied. */
const GAZA_CENTROID: MapCenter = { lat: 31.4, lng: 34.35 };

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/**
 * Lazy-loaded, SSR-safe Leaflet map for showing Gaza governorates/locations.
 *
 * SSR safety: Leaflet reaches for `window`/`document` as soon as it is
 * imported, which crashes Angular's server render. We therefore never import
 * the `leaflet` package at module scope — it is only ever dynamically
 * `import()`-ed inside `ngAfterViewInit`, and only after confirming
 * `isPlatformBrowser()`. On the server (or before the browser-only init has
 * run) this component renders a static pulse placeholder and touches nothing
 * Leaflet-related.
 */
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView implements AfterViewInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly center = input<MapCenter>(GAZA_CENTROID);
  readonly zoom = input(11);
  readonly markers = input<MapMarker[]>([]);
  /** Tailwind height-utility string applied to the container; override per usage. */
  readonly heightClass = input('h-64 sm:h-80 lg:h-96');

  protected readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  protected readonly isReady = signal(false);

  // Imperative Leaflet objects live in plain fields (not signals) — they are
  // mutable handles managed by Leaflet itself, not reactive state.
  private leafletModule: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private markersLayerGroup: Leaflet.LayerGroup | null = null;

  constructor() {
    // Re-centers and re-renders markers whenever the inputs change, but only
    // once the map has actually been created (isReady flips true at the end
    // of ngAfterViewInit). Reading the signals unconditionally at the top —
    // rather than short-circuiting before touching them — is what keeps this
    // effect subscribed to future changes even while it's a no-op.
    effect(() => {
      const center = this.center();
      const zoom = this.zoom();
      const markers = this.markers();
      const ready = this.isReady();

      if (!ready || !this.map || !this.leafletModule) {
        return;
      }

      this.map.setView([center.lat, center.lng], zoom);
      this.renderMarkers(markers);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const container = this.mapContainer()?.nativeElement;
    if (!container) {
      return;
    }

    const L = await import('leaflet');
    this.leafletModule = L;

    const center = this.center();
    const map = L.map(container).setView([center.lat, center.lng], this.zoom());

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    this.markersLayerGroup = L.layerGroup().addTo(map);
    this.map = map;

    // Flips the effect above from a no-op to live, which also performs the
    // initial marker render for whatever markers() held at this point.
    this.isReady.set(true);
  }

  ngOnDestroy(): void {
    // Guarded by nullish-coalescing: no-ops cleanly if the map was never
    // created (SSR, or the component was destroyed before ngAfterViewInit ran).
    this.map?.remove();
    this.map = null;
    this.markersLayerGroup = null;
    this.leafletModule = null;
  }

  private renderMarkers(markers: MapMarker[]): void {
    const L = this.leafletModule;
    const layerGroup = this.markersLayerGroup;
    if (!L || !layerGroup) {
      return;
    }

    layerGroup.clearLayers();

    for (const marker of markers) {
      const leafletMarker = L.marker([marker.lat, marker.lng]);
      if (marker.label) {
        leafletMarker.bindPopup(marker.label);
      }
      leafletMarker.addTo(layerGroup);
    }
  }
}
