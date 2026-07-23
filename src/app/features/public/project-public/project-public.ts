import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Attachment, GOVERNORATE_CENTROIDS, Project } from '@core/models';
import { ProjectsApi } from '@core/api/projects-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { BrandMark } from '@shared/ui/brand-mark/brand-mark';
import { MapMarker, MapView } from '@shared/ui/map/map';
import { PhaseStepper } from '@shared/ui/phase-stepper/phase-stepper';

/**
 * Public view of a reconstruction project — port of the legacy public project
 * page. Server-rendered so a donor can be linked straight to the rebuild they
 * funded.
 *
 * Privacy: this is someone's home, and they did not consent to it being
 * identifiable on an open page. So it deliberately narrows what the record
 * carries — **governorate only** (never district or street), and **progress
 * photos only** (never the damage photos, which show the inside of a damaged
 * family home). `ProjectsApi.getPublicProject` notes that a real backend would
 * strip these server-side; until then the narrowing happens here.
 */
@Component({
  selector: 'app-project-public',
  imports: [RouterLink, TranslatePipe, BrandMark, MapView, PhaseStepper],
  templateUrl: './project-public.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPublic {
  readonly id = input.required<string>();

  private readonly api = inject(ProjectsApi);
  private readonly translation = inject(TranslationService);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getPublicProject(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly project = computed<Project | null>(() => this.resource.value() ?? null);
  protected readonly currentYear = new Date().getFullYear();

  /** Progress photos only — damage photos stay behind authentication. */
  protected readonly photos = computed<Attachment[]>(() => this.project()?.progressPhotos ?? []);

  /** A single governorate-level pin; the exact address is never published. */
  protected readonly marker = computed<MapMarker[]>(() => {
    const project = this.project();
    if (!project) {
      return [];
    }
    const centroid = GOVERNORATE_CENTROIDS[project.address.governorate];
    return [
      {
        id: project.address.governorate,
        lat: centroid.lat,
        lng: centroid.lng,
        label: this.translation.translate(`governorates.${project.address.governorate}`),
      },
    ];
  });

  protected readonly isRtl = this.translation.isRtl;

  protected toggleLocale(): void {
    this.translation.toggleLocale();
  }
}
