import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AssessmentQuestion, GeoArea, GlobalSettings } from '@core/models';
import { GeoAreaDto, GlobalSettingsDto, mapGeoAreaFromDto, mapGlobalSettingsFromDto } from './dto/master.dto';

@Injectable({ providedIn: 'root' })
export class MasterApi {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslationService);
  private readonly base = `${environment.apiUrl}/master`;

  getGeoAreas(): Observable<GeoArea[]> {
    return this.http.get<GeoAreaDto[]>(`${this.base}/geo-areas`).pipe(map((dtos) => dtos.map(mapGeoAreaFromDto)));
  }

  getGlobalSettings(): Observable<GlobalSettings> {
    return this.http.get<GlobalSettingsDto>(`${this.base}/settings`).pipe(map(mapGlobalSettingsFromDto));
  }

  /** Question text is backend content, so the active locale travels with the request. */
  getAssessmentQuestions(): Observable<AssessmentQuestion[]> {
    const params = new HttpParams().set('lang', this.i18n.locale());
    return this.http.get<AssessmentQuestion[]>(`${this.base}/assessment-questions`, { params });
  }
}
