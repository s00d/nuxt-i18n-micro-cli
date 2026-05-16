import pPkg from '../package.json' with { type: 'json' }

export const cliPackage = pPkg
export const cliName = pPkg.name
export const cliVersion = pPkg.version
export const cliDescription = pPkg.description
