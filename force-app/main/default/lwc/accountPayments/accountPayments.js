import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/AccountPaymentController.getAccounts';
import getPaymentsByAccount from '@salesforce/apex/AccountPaymentController.getPaymentsByAccount';
import createPayment from '@salesforce/apex/AccountPaymentController.createPayment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACCOUNT_COLUMNS = [
    { label: 'Account Name', fieldName: 'Name' }
];

const PAYMENT_COLUMNS = [
    { label: 'Payment Type', fieldName: 'Payment_Type__c' },
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
    { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
    { label: 'Notes', fieldName: 'Notes__c' }
];

export default class AccountPayments extends LightningElement {
    // Account listesi
    @track accounts;
    accountError;

    // Payments listesi
    @track payments;
    paymentsError;
    paymentsWireResult; // refreshApex için

    // Datatable column config
    accountColumns = ACCOUNT_COLUMNS;
    paymentColumns = PAYMENT_COLUMNS;

    // Seçili account bilgisi
    selectedAccountId;
    selectedAccountName;

    // Form state
    paymentType = 'Service';
    amount;
    dueDate;
    notes;

    // Accounts'ı Apex'ten çek
    @wire(getAccounts)
    wiredAccounts({ error, data }) {
        if (data) {
            this.accounts = data;
            this.accountError = undefined;
        } else if (error) {
            this.accounts = undefined;
            this.accountError = error;
        }
    }

    // Seçili account'a göre payments'ı Apex'ten çek
    @wire(getPaymentsByAccount, { accountId: '$selectedAccountId' })
    wiredPayments(result) {
        this.paymentsWireResult = result;
        const { data, error } = result;

        if (data) {
            this.payments = data;
            this.paymentsError = undefined;
        } else if (error) {
            this.payments = undefined;
            this.paymentsError = error;
        }
    }

    // Getter'lar
    get isAccountSelected() {
        return !!this.selectedAccountId;
    }

    get noPayments() {
        return this.isAccountSelected && (!this.payments || this.payments.length === 0);
    }

    get paymentTypeOptions() {
        return [
            { label: 'Service', value: 'Service' },
            { label: 'Product', value: 'Product' },
            { label: 'Other', value: 'Other' }
        ];
    }

    // Account datatable row selection
    handleAccountRowSelection(event) {
        const selectedRows = event.detail.selectedRows;

        if (selectedRows && selectedRows.length > 0) {
            const acc = selectedRows[0];
            this.selectedAccountId = acc.Id;
            this.selectedAccountName = acc.Name;
        } else {
            this.selectedAccountId = undefined;
            this.selectedAccountName = undefined;
            this.payments = undefined;
        }
    }

    // Form input değişiklikleri
    handleInputChange(event) {
        const { name, value } = event.target;

        if (name === 'paymentType') {
            this.paymentType = value;
        } else if (name === 'amount') {
            this.amount = value;
        } else if (name === 'dueDate') {
            this.dueDate = value;
        } else if (name === 'notes') {
            this.notes = value;
        }
    }

    // Create Payment butonu
    handleCreatePayment() {
        if (!this.selectedAccountId) {
            this.showToast('Error', 'Please select an Account first.', 'error');
            return;
        }

        if (!this.amount || !this.dueDate || !this.paymentType) {
            this.showToast('Error', 'Please fill in all required fields.', 'error');
            return;
        }

        const paymentRecord = {
            Account__c: this.selectedAccountId,
            Payment_Type__c: this.paymentType,
            Amount__c: this.amount,
            Due_Date__c: this.dueDate,
            Notes__c: this.notes
        };

        createPayment({ payment: paymentRecord })
            .then(() => {
                this.showToast('Success', 'Payment created successfully.', 'success');
                this.clearForm();
                return refreshApex(this.paymentsWireResult);
            })
            .catch(error => {
                let message = 'Error creating payment.';
                if (error && error.body && error.body.message) {
                    message = error.body.message;
                }
                this.showToast('Error', message, 'error');
            });
    }

    clearForm() {
        this.paymentType = 'Service';
        this.amount = null;
        this.dueDate = null;
        this.notes = null;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}