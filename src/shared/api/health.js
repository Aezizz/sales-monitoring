import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./http.js";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiRequest("/health")
  });
}
