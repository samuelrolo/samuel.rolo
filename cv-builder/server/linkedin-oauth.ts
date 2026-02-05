import axios from "axios";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_AUTH_BASE = "https://www.linkedin.com/oauth/v2";

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInProfile {
  id: string;
  firstName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  lastName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  profilePicture?: {
    displayImage: string;
  };
}

interface LinkedInEmailResponse {
  elements: Array<{
    "handle~": {
      emailAddress: string;
    };
  }>;
}

interface LinkedInPosition {
  company: {
    name: string;
  };
  title: string;
  timePeriod: {
    startDate: {
      month: number;
      year: number;
    };
    endDate?: {
      month: number;
      year: number;
    };
  };
  description?: string;
}

/**
 * Trocar código OAuth por access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<LinkedInTokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth credentials not configured");
  }

  try {
    const response = await axios.post(
      `${LINKEDIN_AUTH_BASE}/accessToken`,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error exchanging code for token:", error.response?.data || error.message);
    throw new Error("Failed to exchange authorization code for access token");
  }
}

/**
 * Obter perfil básico do utilizador
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching LinkedIn profile:", error.response?.data || error.message);
    throw new Error("Failed to fetch LinkedIn profile");
  }
}

/**
 * Obter email do utilizador
 */
export async function getLinkedInEmail(accessToken: string): Promise<string> {
  try {
    const response = await axios.get<LinkedInEmailResponse>(
      `${LINKEDIN_API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const email = response.data.elements[0]?.["handle~"]?.emailAddress;
    if (!email) {
      throw new Error("Email not found in LinkedIn response");
    }

    return email;
  } catch (error: any) {
    console.error("Error fetching LinkedIn email:", error.response?.data || error.message);
    throw new Error("Failed to fetch LinkedIn email");
  }
}

/**
 * Obter posições profissionais (experiência)
 */
export async function getLinkedInPositions(accessToken: string): Promise<LinkedInPosition[]> {
  try {
    // Nota: A API de posições do LinkedIn requer permissões específicas
    // que podem não estar disponíveis em todas as aplicações
    const response = await axios.get(
      `${LINKEDIN_API_BASE}/positions?q=members&projection=(elements*(company,title,timePeriod,description))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.elements || [];
  } catch (error: any) {
    console.error("Error fetching LinkedIn positions:", error.response?.data || error.message);
    // Retornar array vazio se não tiver permissões
    return [];
  }
}

/**
 * Mapear dados do LinkedIn para estrutura do CV
 */
export function mapLinkedInDataToResume(
  profile: LinkedInProfile,
  email: string,
  positions: LinkedInPosition[]
): any {
  // Extrair nome completo
  const firstNameLocale = profile.firstName.preferredLocale;
  const lastNameLocale = profile.lastName.preferredLocale;
  const localeKey = `${firstNameLocale.language}_${firstNameLocale.country}`;

  const firstName = profile.firstName.localized[localeKey] || Object.values(profile.firstName.localized)[0] || "";
  const lastName = profile.lastName.localized[localeKey] || Object.values(profile.lastName.localized)[0] || "";

  // Mapear experiências
  const experience = positions.slice(0, 5).map((pos, index) => {
    const startDate = `${pos.timePeriod.startDate.year}-${String(pos.timePeriod.startDate.month).padStart(2, "0")}`;
    const endDate = pos.timePeriod.endDate
      ? `${pos.timePeriod.endDate.year}-${String(pos.timePeriod.endDate.month).padStart(2, "0")}`
      : "";

    return {
      id: `exp-${index + 1}`,
      company: pos.company.name,
      position: pos.title,
      startDate,
      endDate,
      current: !pos.timePeriod.endDate,
      description: pos.description || "",
      achievements: [],
    };
  });

  // Estrutura base do CV
  return {
    personalInfo: {
      fullName: `${firstName} ${lastName}`.trim(),
      title: positions[0]?.title || "",
      email: email,
      phone: "",
      address: "",
      linkedin: `https://www.linkedin.com/in/${profile.id}`,
      website: "",
      photo: profile.profilePicture?.displayImage || "",
    },
    summary: "",
    experience: experience.length > 0 ? experience : [
      {
        id: "exp-1",
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        achievements: [],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
      },
    ],
    skills: Array.from({ length: 5 }, (_, i) => ({
      id: `skill-${i + 1}`,
      name: "",
      level: 70,
      category: "Técnica",
    })),
    languages: [],
    certifications: [],
    courses: [],
    references: [],
  };
}
