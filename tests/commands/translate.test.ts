import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import translateCommand from '../../src/commands/translate'
import { resolveProjectContext, parsePositiveIntArg } from '../../src/commands/_shared'
import { parseOptions } from '../../src/core/utils/json'
import { translateMissing } from '../../src/core/services/TranslationService'
import { loadGlossaryCatalog } from '../../src/core/services/GlossaryService'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
  parsePositiveIntArg: vi.fn((_value: string | undefined, _name: string, fallback: number) => fallback),
}))

vi.mock('../../src/core/utils/json', () => ({
  parseOptions: vi.fn(),
}))

vi.mock('../../src/core/services/TranslationService', () => ({
  translateMissing: vi.fn(),
}))

vi.mock('../../src/core/services/GlossaryService', () => ({
  loadGlossaryCatalog: vi.fn(),
}))

vi.mock('../../src/core/translate/TranslatorRegistry', () => ({
  default: { google: {} },
}))

describe('translate command', () => {
  const project = { save: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: project as never,
    })
    vi.mocked(parseOptions).mockReturnValue({ format: 'html' })
    vi.mocked(loadGlossaryCatalog).mockReturnValue({ entries: [] })
  })

  it('calls translate service and saves project', async () => {
    if (translateCommand.run) {
      await translateCommand.run({
        args: { service: 'google', token: 'abc', options: 'format:html', replace: false, chunkSize: '50' },
      } as never)
    }

    expect(parsePositiveIntArg).toHaveBeenCalledWith('50', 'chunkSize', 50)
    expect(translateMissing).toHaveBeenCalledWith(project, {
      service: 'google',
      token: 'abc',
      options: { format: 'html' },
      replace: false,
      chunkSize: 50,
    })
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Translations have been automatically processed.')
  })

  it('loads glossary catalog when glossary file is provided', async () => {
    vi.mocked(loadGlossaryCatalog).mockReturnValue({
      entries: [{ source: 'Save', target: 'Сохранить', from: 'en', to: 'ru' }],
    })

    if (translateCommand.run) {
      await translateCommand.run({
        args: {
          service: 'google',
          token: 'abc',
          options: 'format:html',
          replace: false,
          chunkSize: '50',
          glossaryFile: '.i18n-glossary.json',
        },
      } as never)
    }

    expect(loadGlossaryCatalog).toHaveBeenCalled()
    expect(translateMissing).toHaveBeenCalledWith(project, expect.objectContaining({
      options: expect.objectContaining({
        glossaryCatalog: expect.any(Object),
      }),
    }))
  })
})
