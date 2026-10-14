import { Injectable } from '@angular/core';
import { ArticleDashboard, CustomerDashboard } from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportDashboardService extends SoftSupportApiBase {
  getArticles(): Observable<ArticleDashboard> {
    return this.getData<ArticleDashboard>('dashboard/articles');
  }

  getCustomers(): Observable<CustomerDashboard> {
    return this.getData<CustomerDashboard>('dashboard/customers');
  }
}
