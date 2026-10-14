import { Injectable } from '@angular/core';
import {
  CompanyDetail,
  CompanyListItem,
  CompanySaved,
  ContractHistoryItem,
  ContractHistoryQuery,
  ContractLine,
  CustomerSaved,
  SaveCompanyPayload,
  SaveContractPayload,
  SaveCustomerPayload,
  SOFTSUPPORT_DEFAULT_PAGE_SIZE,
  SoftSupportApiResponse,
  SoftSupportPagedResult,
} from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

/** Sociétés clientes, contrats, utilisateurs du portail et historique. */
@Injectable({ providedIn: 'root' })
export class SoftSupportCompanyService extends SoftSupportApiBase {
  getAll(): Observable<CompanyListItem[]> {
    return this.getData<CompanyListItem[]>('companies');
  }

  get(companyId: number): Observable<CompanyDetail> {
    return this.getData<CompanyDetail>(`companies/${companyId}`);
  }

  getCrmNames(): Observable<string[]> {
    return this.getData<string[]>('companies/crm-names');
  }

  create(payload: SaveCompanyPayload): Observable<SoftSupportApiResponse<CompanySaved>> {
    return this.sendData<CompanySaved>('POST', 'companies', payload);
  }

  update(companyId: number, payload: SaveCompanyPayload): Observable<string> {
    return this.sendMessage('PUT', `companies/${companyId}`, payload);
  }

  delete(companyId: number): Observable<string> {
    return this.sendMessage('DELETE', `companies/${companyId}`);
  }

  getProductContracts(companyId: number, productId: number): Observable<ContractLine[]> {
    return this.getData<ContractLine[]>(`companies/${companyId}/products/${productId}/contracts`);
  }

  addContract(companyId: number, payload: SaveContractPayload): Observable<string> {
    return this.sendMessage('POST', `companies/${companyId}/contracts`, payload);
  }

  renewContract(companyId: number, payload: SaveContractPayload): Observable<string> {
    return this.sendMessage('POST', `companies/${companyId}/contracts/renew`, payload);
  }

  updateContract(contractId: number, payload: SaveContractPayload): Observable<string> {
    return this.sendMessage('PUT', `contracts/${contractId}`, payload);
  }

  deleteContract(contractId: number): Observable<string> {
    return this.sendMessage('DELETE', `contracts/${contractId}`);
  }

  addCustomer(companyId: number, payload: SaveCustomerPayload): Observable<SoftSupportApiResponse<CustomerSaved>> {
    return this.sendData<CustomerSaved>('POST', `companies/${companyId}/customers`, payload);
  }

  updateCustomer(customerId: number, payload: SaveCustomerPayload): Observable<SoftSupportApiResponse<CustomerSaved>> {
    return this.sendData<CustomerSaved>('PUT', `customers/${customerId}`, payload);
  }

  deleteCustomer(customerId: number): Observable<string> {
    return this.sendMessage('DELETE', `customers/${customerId}`);
  }

  getHistory(query: ContractHistoryQuery = {}): Observable<SoftSupportPagedResult<ContractHistoryItem>> {
    return this.getData<SoftSupportPagedResult<ContractHistoryItem>>(
      'contracts/history',
      this.params({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? SOFTSUPPORT_DEFAULT_PAGE_SIZE,
        search: query.search,
        type: query.type,
      }),
    );
  }
}
