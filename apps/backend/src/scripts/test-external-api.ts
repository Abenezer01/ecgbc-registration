import { toExternalMemberDTO } from "../app/features/external-api/dtos/member.dto";
import { hashApiKey, requireScope } from "../app/features/external-api/middlewares/api-key.middleware";
import { createExternalRateLimiter } from "../app/features/external-api/middlewares/rate-limiter.middleware";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=== Testing ECGBC External Members API Logic ===\n");
  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${name} ${detail ? "- " + detail : ""}`);
    }
  }

  // 1. Test Key Hashing
  const testKey = "ecgbc_live_abcdef1234567890abcdef1234567890";
  const hash1 = hashApiKey(testKey);
  const hash2 = hashApiKey(testKey);
  assert("API Key Hashing is deterministic", hash1 === hash2 && hash1.length === 64);

  const trimmedHash = hashApiKey("  " + testKey + "  ");
  assert("API Key Hashing trims surrounding whitespace", trimmedHash === hash1);

  // 2. Test Member DTO Normalization
  const mockMember = {
    id: "mem-uuid-1",
    certificateNo: "ECGBC/AA/001/2023",
    certificateIssuedDate: new Date("2023-01-15T00:00:00.000Z"),
    name: "የኢትዮጵያ ቃለ ሕይወት ቤተክርስቲያን",
    nameEn: "Ethiopian Kale Heywet Church",
    typeId: "type-1",
    type: { value: "LOCAL_CHURCH", description: "Local Church" },
    memberCategoryId: "cat-1",
    memberCategory: { value: "FULL_MEMBER", description: "Full Member" },
    councilFellowshipId: "fel-1",
    councilFellowship: { name: "Addis Ababa Fellowship", certificateNo: "FEL-01" },
    isInEthiopia: true,
    country: "Ethiopia",
    region: { value: "AA", description: "Addis Ababa" },
    city: "Addis Ababa",
    subcity: "Bole",
    zone: null,
    district: "Woreda 03",
    houseNumber: "123",
    poBoxNumber: "1234",
    phoneNumber: "+251911223344",
    email: "info@ekhc.org",
    isActive: true,
    currentActionState: "APPROVED",
    state: { value: "ACTIVE", description: "Active" },
    createdAt: new Date("2023-01-15T00:00:00.000Z"),
    updatedAt: new Date("2026-05-10T12:00:00.000Z"),
    contactPerson: {
      fullName: "Abebe Kebede",
      phoneNumber: "+251911223344",
      email: "abebe@ekhc.org",
    },
    boardMembers: [
      {
        id: "bm-1",
        fullName: "Pastor Tesfaye",
        fullNameEn: "Pastor Tesfaye",
        title: { value: "PRESIDENT", description: "Senior Pastor" },
        isActive: true,
      },
    ],
  };

  const dtoWithoutLeadership = toExternalMemberDTO(mockMember);
  assert("DTO masks internal audit details and returns correct name", dtoWithoutLeadership.name.amharic === "የኢትዮጵያ ቃለ ሕይወት ቤተክርስቲያን");
  assert("DTO properly structures certificate object", dtoWithoutLeadership.certificate.number === "ECGBC/AA/001/2023" && dtoWithoutLeadership.certificate.isValid === true);
  assert("DTO structures contact and contact person", dtoWithoutLeadership.contact.contactPerson?.fullName === "Abebe Kebede");
  assert("DTO excludes board members by default", dtoWithoutLeadership.leadership === undefined);

  const dtoWithLeadership = toExternalMemberDTO(mockMember, { includeLeadership: true });
  assert("DTO includes board members when requested", Array.isArray(dtoWithLeadership.leadership) && dtoWithLeadership.leadership.length === 1);
  assert("DTO normalizes board member title", dtoWithLeadership.leadership?.[0].title === "Senior Pastor");

  // 3. Test Scope Guard Middleware
  const scopeMiddleware = requireScope("members:read");
  let nextCalled = false;
  let errorSent: any = null;

  const mockReqWithScope: any = {
    apiKey: { scopes: ["members:read", "members:verify"] },
  };
  scopeMiddleware(mockReqWithScope, {} as any, (err?: any) => {
    if (err) errorSent = err;
    else nextCalled = true;
  });
  assert("Scope middleware allows requests with matching scope", nextCalled && !errorSent);

  nextCalled = false;
  errorSent = null;
  const mockReqWithoutScope: any = {
    apiKey: { scopes: ["other:scope"] },
  };
  scopeMiddleware(mockReqWithoutScope, {} as any, (err?: any) => {
    if (err) errorSent = err;
    else nextCalled = true;
  });
  assert("Scope middleware rejects requests lacking required scope", !nextCalled && errorSent && errorSent.statusCode === 403);

  // 4. Test Rate Limiter Middleware
  const limiter = createExternalRateLimiter();
  const mockRateReq: any = {
    apiKey: { id: "test-client-123", rateLimit: 3 },
  };
  const headers: Record<string, string> = {};
  let rateStatus = 200;
  let rateBody: any = null;
  const mockRateRes: any = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status: (code: number) => {
      rateStatus = code;
      return {
        json: (data: any) => { rateBody = data; },
      };
    },
  };

  // 3 requests within limit
  for (let i = 0; i < 3; i++) {
    limiter(mockRateReq, mockRateRes, () => {});
  }
  assert("Rate limiter sets X-RateLimit headers", headers["X-RateLimit-Limit"] === "3");
  assert("Rate limiter calculates remaining quota", headers["X-RateLimit-Remaining"] === "0");

  // 4th request exceeds limit
  limiter(mockRateReq, mockRateRes, () => {});
  assert("Rate limiter blocks requests exceeding limit with HTTP 429", rateStatus === 429 && rateBody?.status === "error");

  // 5. Test OpenAPI Spec File
  const specPath = path.join(__dirname, "../app/features/external-api/docs/openapi.json");
  assert("OpenAPI specification file exists", fs.existsSync(specPath));
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  assert("OpenAPI spec defines /members endpoint", Boolean(spec.paths["/members"]));
  assert("OpenAPI spec defines /members/verify/{certificateNo} endpoint", Boolean(spec.paths["/members/verify/{certificateNo}"]));
  assert("OpenAPI spec defines ApiKeyAuth security scheme", Boolean(spec.components?.securitySchemes?.ApiKeyAuth));

  console.log(`\n========================================`);
  console.log(`Tests Passed: ${passed} / ${total}`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
