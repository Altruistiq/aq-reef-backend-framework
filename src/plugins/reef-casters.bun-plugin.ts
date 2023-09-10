import { BunPlugin, plugin } from "bun";
import * as fs from "fs/promises";

const reefCasters: BunPlugin = {
  name: "reef-casters",
  async setup(build) {
    build.onLoad({ filter: /\.(ts)$/ }, async (args) => {
      let contents = await fs.readFile(args.path, "utf8");
      const trs = new Bun.Transpiler({ loader: 'ts' })
      const imports = trs.scanImports(contents)
      const bpdImport = imports.find(i => i.kind === 'import-statement' && /base-param-decorators\.class$/g.test(i.path))
      if (!(
        contents.includes('extends BaseController')
        && contents.includes('@Controller(')
        && bpdImport
      )) return { contents }

      const findEndpointInputsRegexp = /((@Query|@Body|@Param)[\s\n]*\([\s\n]*.*[\s\n]*\)[\s\n]*)[\s\n]*(\w+)[\s\n]*:[\s\n]*(?<type>\w+)/gm
      contents = contents.replace(findEndpointInputsRegexp, (match, p1, p2, p3, p4) => {
        const needsCapitalize = ['string', 'number', 'boolean', 'symbol'].includes(p4)
        const needsToLeftAlone = !needsCapitalize && (['Array', 'Object'].includes(p4) || p4.endsWith('[]') || isFirstLetterLower(p4))

        if (needsToLeftAlone) return match
        if (needsCapitalize) p4 = p4[0].toUpperCase() + p4.slice(1)
        return `${p1} @__BUN_REEF_TYPE__(${p4}) ${p3}`
      })

     return {
        contents: `;import { __BUN_REEF_TYPE__ } from '${bpdImport.path.replace(/base-param-decorators\.class$/g, 'bun-specific.internal-decorator')}'; ${contents}`,
      }
    })
  },
}

plugin(reefCasters)

function isFirstLetterLower(str: string) {
  return str[0] === str[0].toLowerCase();
}
