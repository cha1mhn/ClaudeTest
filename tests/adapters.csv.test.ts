import { parseCsv, customersFromCsv, dealsFromCsv, eventsFromCsv, toCsv } from "../src/adapters/csv";

const CUSTOMER_CSV = `id,name,segment,arr,mrr,contractStartDate,churnDate,churnReason
c1,Acme Corp,enterprise,120000,10000,2023-01-01,,
c2,Beta Inc,mid_market,48000,4000,2023-06-01,,
c3,Gamma LLC,smb,12000,1000,2023-03-01,2024-01-15,price`;

const DEAL_CSV = `id,name,accountId,stage,amount,arr,closeDate,createdDate,ownerId,segment,probability
d1,Acme Renewal,c1,proposal,150000,150000,2024-01-31,2023-11-01,rep1,enterprise,80
d2,Delta Deal,c5,closed_won,60000,60000,2024-01-25,2023-10-01,rep2,mid_market,100`;

const EVENT_CSV = `id,customerId,type,mrr,arr,date
e1,c4,new_business,2000,24000,2024-01-10
e2,c1,expansion,1000,12000,2024-01-20`;

describe("CSV Adapter", () => {
  describe("parseCsv", () => {
    it("parses rows correctly", () => {
      const rows = parseCsv(CUSTOMER_CSV);
      expect(rows).toHaveLength(3);
      expect(rows[0].name).toBe("Acme Corp");
    });

    it("returns empty array for empty input", () => {
      expect(parseCsv("")).toHaveLength(0);
    });
  });

  describe("customersFromCsv", () => {
    it("parses customers with correct types", () => {
      const cs = customersFromCsv(CUSTOMER_CSV);
      expect(cs).toHaveLength(3);
      expect(cs[0].arr).toBe(120000);
      expect(cs[0].contractStartDate).toBeInstanceOf(Date);
    });

    it("parses optional churn date", () => {
      const cs = customersFromCsv(CUSTOMER_CSV);
      expect(cs[2].churnDate).toBeInstanceOf(Date);
      expect(cs[0].churnDate).toBeUndefined();
    });
  });

  describe("dealsFromCsv", () => {
    it("parses deals", () => {
      const ds = dealsFromCsv(DEAL_CSV);
      expect(ds).toHaveLength(2);
      expect(ds[0].stage).toBe("proposal");
      expect(ds[1].stage).toBe("closed_won");
    });
  });

  describe("eventsFromCsv", () => {
    it("parses revenue events", () => {
      const es = eventsFromCsv(EVENT_CSV);
      expect(es).toHaveLength(2);
      expect(es[0].type).toBe("new_business");
      expect(es[0].date).toBeInstanceOf(Date);
    });
  });

  describe("toCsv", () => {
    it("serialises objects to CSV", () => {
      const data = [{ a: 1, b: "hello" }, { a: 2, b: "world" }];
      const csv = toCsv(data);
      const lines = csv.split("\n");
      expect(lines[0]).toBe("a,b");
      expect(lines[1]).toBe("1,hello");
    });

    it("returns empty string for empty input", () => {
      expect(toCsv([])).toBe("");
    });
  });
});
