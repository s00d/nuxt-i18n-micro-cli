namespace Domain {
  export enum ErrorCode {
    NotFound = 'not_found',
    PermissionDenied = 'permission_denied',
  }
}

const API_SCHEMA = {
  auth: {
    login: {
      path: '/api/login',
      method: 'POST',
      headers: {
        required: 'authorization',
      },
    },
    logout: {
      path: '/api/logout',
      method: 'POST',
    },
  },
  profile: {
    path: '/api/profile',
    fields: ['name', 'email'],
  },
} as const

const uiText = 'Save profile'

export { API_SCHEMA, Domain, uiText }
