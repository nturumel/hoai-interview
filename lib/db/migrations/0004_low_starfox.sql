DROP TABLE IF EXISTS InvoiceDocument;

CREATE TABLE InvoiceDocument (
  invoiceId TEXT NOT NULL,
  documentUrl TEXT NOT NULL,
  documentName TEXT NOT NULL,
  PRIMARY KEY (invoiceId, documentUrl),
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id)
);