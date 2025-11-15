public with sharing class AccountPaymentController {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        // Basit bir Account listesi döndürüyoruz
        return [
            SELECT Id, Name, Industry, Rating
            FROM Account
            ORDER BY Name
            LIMIT 200
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Payment__c> getPaymentsByAccount(Id accountId) {
        if (accountId == null) {
            return new List<Payment__c>();
        }

        return [
            SELECT Id, Name, Payment_Type__c, Amount__c,
                   Due_Date__c, Notes__c, Account__c
            FROM Payment__c
            WHERE Account__c = :accountId
            ORDER BY Due_Date__c ASC
        ];
    }

    @AuraEnabled
    public static Payment__c createPayment(Payment__c payment) {
        if (payment == null || payment.Account__c == null) {
            throw new AuraHandledException('Account is required for a Payment.');
        }

        // Due Date validation rule'u zaten kontrol edecek
        insert payment;

        return payment;
    }
}