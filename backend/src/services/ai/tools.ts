import { SchemaType } from '@google/generative-ai';
import type { FunctionDeclarationsTool } from '@google/generative-ai';

/**
 * Tool definitions for the AI agent.
 * These are Gemini function declarations that the model can call.
 */
export const agentTools: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: 'search_doctors',
        description:
          'Search for doctors in the HealTrip database. Use this to find medical professionals matching specific criteria like specialty, location, language, or rating. Always use this tool before recommending any doctor to the patient.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            specialty: {
              type: SchemaType.STRING,
              description:
                'Medical specialty to filter by (e.g., "Cardiology", "Orthopedics", "Neurology"). Supports partial matching.',
            },
            city: {
              type: SchemaType.STRING,
              description: 'City to filter by (e.g., "Istanbul", "Riyadh", "Abu Dhabi").',
            },
            country: {
              type: SchemaType.STRING,
              description: 'Country to filter by (e.g., "Turkey", "Saudi Arabia", "UAE").',
            },
            language: {
              type: SchemaType.STRING,
              description:
                'Preferred language of the doctor (e.g., "Arabic", "English", "Turkish").',
            },
            minRating: {
              type: SchemaType.NUMBER,
              description: 'Minimum rating filter (0-5 scale).',
            },
            maxFee: {
              type: SchemaType.NUMBER,
              description: 'Maximum consultation fee in USD.',
            },
            limit: {
              type: SchemaType.NUMBER,
              description: 'Maximum number of results to return. Default is 5.',
            },
          },
        },
      },
      {
        name: 'search_hospitals',
        description:
          'Search for hospitals in the HealTrip database. Use this to find medical facilities matching specific criteria like location, specialty availability, emergency services, or rating.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: {
              type: SchemaType.STRING,
              description: 'City to filter by.',
            },
            country: {
              type: SchemaType.STRING,
              description: 'Country to filter by.',
            },
            specialty: {
              type: SchemaType.STRING,
              description:
                'Filter hospitals that have this specialty available.',
            },
            emergencyOnly: {
              type: SchemaType.BOOLEAN,
              description: 'If true, only return hospitals with emergency services.',
            },
            minRating: {
              type: SchemaType.NUMBER,
              description: 'Minimum rating filter (0-5 scale).',
            },
            limit: {
              type: SchemaType.NUMBER,
              description: 'Maximum number of results to return. Default is 5.',
            },
          },
        },
      },
      {
        name: 'get_specialties',
        description:
          'Get a list of all available medical specialties in the HealTrip system. Use this when you need to determine which specialty is most relevant for the patient\'s symptoms, or when the patient asks what specialties are available.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'assess_urgency',
        description:
          'Assess the urgency level of the patient\'s symptoms. Use this to classify whether the situation is an emergency, urgent, routine, or suitable for self-care. This helps determine the appropriate course of action.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            symptoms: {
              type: SchemaType.STRING,
              description: 'Description of the patient\'s symptoms.',
            },
            duration: {
              type: SchemaType.STRING,
              description: 'How long the patient has been experiencing symptoms.',
            },
            severity: {
              type: SchemaType.STRING,
              description: 'Patient-reported severity level (mild, moderate, severe).',
            },
            additionalContext: {
              type: SchemaType.STRING,
              description:
                'Any additional context like pre-existing conditions, medications, age, etc.',
            },
          },
          required: ['symptoms'],
        },
      },
    ],
  },
];
