import { getEscIndices, isStrEscaped } from 'escape-mkdn';

import { CONST } from '../var/const';
import { RGX } from '../var/regex';
import { getMediaKind } from './media';


interface ScanOpts {
  filename?: string;
  kind?: string;
  skipEsc?: boolean;
}

interface WikiAttrResult {
  kind: string;
  type: [string, number] | [];
  filenames: [string, number][];
}

interface WikiLinkResult {
  kind: string;
  type: [string, number] | [];
  filename: [string, number];
  label: [string, number] | [];
}

interface WikiEmbedResult {
  kind: string;
  filename: [string, number] | [];
  media: string;
}

export function scan(content: string, opts?: ScanOpts): (WikiAttrResult | WikiLinkResult | WikiEmbedResult)[] {
  const res: (WikiAttrResult | WikiLinkResult | WikiEmbedResult)[] = [];
  // opts
  const kind     : string | undefined  = opts ? opts.kind     : undefined;
  const filename : string | undefined  = opts ? opts.filename : undefined;
  const skipEsc  : boolean | undefined = opts ? opts.skipEsc  : true;
  const escdIndices: number[] = getEscIndices(content);
  // go
  // attr //
  const fullTxtAttrs: string[] = [];
  if (!kind || (kind === CONST.WIKI.REF) || (kind === CONST.WIKI.ATTR)) {
    let attrMatch, fnameMatch: RegExpExecArray | null;
    const attrsGottaCatchEmAll: RegExp = new RegExp(RGX.WIKI.ATTR, 'gim');
    const singlesGottaCatchEmAll: RegExp = new RegExp(RGX.WIKI.BASE, 'gim');
    // 🦨 do-while: https://stackoverflow.com/a/6323598
    do {
      attrMatch = attrsGottaCatchEmAll.exec(content);
      if (attrMatch) {
        fullTxtAttrs.push(attrMatch[0]);
        const matchText: string = attrMatch[0];
        const attrtypeText: string = attrMatch[1];
        // files
        const filenames: [string, number][] = [];
        do {
          fnameMatch = singlesGottaCatchEmAll.exec(matchText);
          if (fnameMatch) {
            const twoLeftBrackets = 2;
            const filenameText: string = fnameMatch[1];
            const filenameOffset = attrMatch.index + twoLeftBrackets + fnameMatch.index;
            if (!filename || (filename === filenameText)) {
              /* eslint-disable indent */
              const escaped: boolean = isStrEscaped(
                                                      filenameText, content,
                                                      filenameOffset, escdIndices,
                                                    );
              /* eslint-enable indent */
              if (skipEsc || !escaped) {
                filenames.push([filenameText, filenameOffset]);
              }
            }
          }
        } while (fnameMatch);
        const attrtypeOffset: number = attrMatch.index + matchText.indexOf(attrtypeText);
        const trimmedAttrTypeText: string = attrtypeText.trim();
        /* eslint-disable indent */
        const escaped: boolean = isStrEscaped(
                                                trimmedAttrTypeText, content,
                                                attrtypeOffset, escdIndices,
                                              );
        /* eslint-enable indent */
        if ((filenames.length !== 0) && (skipEsc || !escaped)) {
          res.push({
            kind: CONST.WIKI.ATTR,
            type: [trimmedAttrTypeText, attrtypeOffset],
            filenames: filenames,
          } as WikiAttrResult);
        }
      }
    } while (attrMatch);
  }
  // note: consume processed wikiattrs so they are
  //       not mistaken for inlines in next section
  for (const txt of fullTxtAttrs) {
    content = content.replace(txt, (match) => {
    // pad with whitespace so positions don't get screwed up
      return ' '.repeat(match.length);
    });
  }
  // embed //
  if (!kind || (kind === CONST.WIKI.REF) || (kind === CONST.WIKI.EMBED)) {
    const embedsGottaCatchEmAll: RegExp = new RegExp(RGX.WIKI.EMBED, 'g');
    // 🦨 do-while: https://stackoverflow.com/a/6323598
    let embedMatch: RegExpExecArray | null;
    do {
      embedMatch = embedsGottaCatchEmAll.exec(content);
      if (embedMatch) {
        const matchText      : string = embedMatch[0];
        const fileNameText   : string = embedMatch[1];

        const wikilinkOffset = embedMatch.index;
        const filenameOffset = matchText.indexOf(fileNameText);
        if (!filename || (filename === fileNameText)) {
          /* eslint-disable indent */
          const escaped: boolean = isStrEscaped(
                                                  matchText, content,
                                                  wikilinkOffset, escdIndices,
                                                );
          /* eslint-enable indent */
          if (skipEsc || !escaped) {
            res.push({
              kind: CONST.WIKI.EMBED,
              filename: [fileNameText, wikilinkOffset + filenameOffset],
              media: getMediaKind(fileNameText),
            } as WikiEmbedResult);
          }
        }
      }
    } while (embedMatch);
  }
  // link //
  if (!kind || (kind === CONST.WIKI.REF) || (kind === CONST.WIKI.LINK)) {
    const linksGottaCatchEmAll: RegExp = new RegExp(RGX.WIKI.LINK, 'g');
    // 🦨 do-while: https://stackoverflow.com/a/6323598
    let linkMatch: RegExpExecArray | null;
    do {
      linkMatch = linksGottaCatchEmAll.exec(content);
      if (linkMatch) {
        const matchText      : string = linkMatch[0];
        const linkTypeText   : string = linkMatch[1];
        const fileNameText   : string = linkMatch[2];
        // const headerText     : string = linkMatch[4];
        const labelText      : string = linkMatch[3];

        const wikilinkOffset = linkMatch.index;
        const linkTypeOffset = matchText.indexOf(linkTypeText);
        const filenameOffset = matchText.indexOf(fileNameText);
        const labelOffset    = matchText.indexOf(labelText);
        if (!filename || (filename === fileNameText)) {
          /* eslint-disable indent */
          const escaped: boolean = isStrEscaped(
                                                  matchText, content,
                                                  wikilinkOffset, escdIndices,
                                                );
          /* eslint-enable indent */
          if (skipEsc || !escaped) {
            const type : [string, number] | [] = (linkTypeText) ? [linkTypeText.trim(), linkMatch.index + linkTypeOffset] : [];
            const label: [string, number] | [] = (labelText)    ? [labelText, linkMatch.index + labelOffset]              : [];
            res.push({
              kind: CONST.WIKI.LINK,
              type: type,
              filename: [fileNameText, wikilinkOffset + filenameOffset],
              label: label,
            });
          }
        }
      }
    } while (linkMatch);
  }
  return res;
}
