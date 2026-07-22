import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AssessmentQuestion } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { MasterApi } from '@core/api/master-api.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/**
 * Assessment question-bank viewer — port of the legacy `questions` module.
 *
 * The question set is curated bilingual backend content resolved to the current
 * locale by `MasterApi`, not UI copy. Editing it means authoring both languages
 * and its branching (`nextQuestionId`) — a content task out of scope here — so
 * this is a faithful read view of the flow beneficiaries answer, letting an
 * operator see exactly what damage data is collected and where each answer
 * leads. Same call the customer app's damage-report wizard drives from.
 */
@Component({
  selector: 'app-question-bank',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './question-bank.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBank {
  private readonly api = inject(MasterApi);

  private readonly resource = rxResource({ stream: () => this.api.getAssessmentQuestions() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly questions = computed<AssessmentQuestion[]>(() => this.resource.value() ?? []);
  protected readonly skeletons = [0, 1, 2, 3];

  /** Prompt of a branch target, for the "leads to →" hint. */
  protected promptFor(id: string | undefined): string | null {
    if (!id) {
      return null;
    }
    return this.questions().find((question) => question.id === id)?.prompt ?? null;
  }
}
