import { DOMAIN_OPTIONS } from "../data/domains";

const DOMAIN_SET = new Set(DOMAIN_OPTIONS);

export function splitRequestMetadata(request) {
  const domains = new Set(Array.isArray(request?.domains) ? request.domains : []);
  const competencies = [];

  if (request?.category) {
    domains.add(request.category);
  }

  if (Array.isArray(request?.skills)) {
    request.skills.forEach((item) => {
      if (!item) {
        return;
      }

      if (DOMAIN_SET.has(item)) {
        domains.add(item);
        return;
      }

      competencies.push(item);
    });
  }

  return {
    domains: [...domains],
    competencies,
  };
}
