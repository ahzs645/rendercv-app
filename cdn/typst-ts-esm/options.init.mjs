/**
 * this mark is used to identify the beforeBuild stage
 * @description will not be used in runtime code
 */
const BeforeBuildSymbol = Symbol('beforeBuild');
/** @internal */
const _textFonts = [
    'DejaVuSansMono-Bold.ttf',
    'DejaVuSansMono-BoldOblique.ttf',
    'DejaVuSansMono-Oblique.ttf',
    'DejaVuSansMono.ttf',
    'LibertinusSerif-Bold.otf',
    'LibertinusSerif-BoldItalic.otf',
    'LibertinusSerif-Italic.otf',
    'LibertinusSerif-Regular.otf',
    'LibertinusSerif-Semibold.otf',
    'LibertinusSerif-SemiboldItalic.otf',
    'NewCM10-Bold.otf',
    'NewCM10-BoldItalic.otf',
    'NewCM10-Italic.otf',
    'NewCM10-Regular.otf',
    'NewCMMath-Bold.otf',
    'NewCMMath-Book.otf',
    'NewCMMath-Regular.otf',
];
/** @internal */
const _cjkFonts = [
    'InriaSerif-Bold.ttf',
    'InriaSerif-BoldItalic.ttf',
    'InriaSerif-Italic.ttf',
    'InriaSerif-Regular.ttf',
    'Roboto-Regular.ttf',
    'NotoSerifCJKsc-Regular.otf',
];
/** @internal */
const _emojiFonts = ['TwitterColorEmoji.ttf', 'NotoColorEmoji-Regular-COLR.subset.ttf'];
/**
 * disable default font assets
 */
export function disableDefaultFontAssets() {
    return loadFonts([], { assets: false });
}
/**
 * preload font assets
 */
export function preloadFontAssets(options) {
    return loadFonts([], options);
}
export function _resolveAssets(options) {
    const fonts = [];
    if (options &&
        options?.assets !== false &&
        options?.assets?.length &&
        options?.assets?.length > 0) {
        let defaultPrefix = {
            text: '/cdn/typst-fonts/',
            _: '/cdn/typst-fonts/',
        };
        let assetUrlPrefix = options.assetUrlPrefix ?? defaultPrefix;
        if (typeof assetUrlPrefix === 'string') {
            assetUrlPrefix = { _: assetUrlPrefix };
        }
        else {
            assetUrlPrefix = { ...defaultPrefix, ...assetUrlPrefix };
        }
        for (const key of Object.keys(assetUrlPrefix)) {
            const u = assetUrlPrefix[key];
            if (u[u.length - 1] !== '/') {
                assetUrlPrefix[key] = u + '/';
            }
        }
        const prefix = (asset, f) => f.map(font => (assetUrlPrefix[asset] || assetUrlPrefix['_']) + font);
        for (const asset of options.assets) {
            switch (asset) {
                case 'text':
                    fonts.push(...prefix(asset, _textFonts));
                    break;
                case 'cjk':
                    fonts.push(...prefix(asset, _cjkFonts));
                    break;
                case 'emoji':
                    fonts.push(...prefix(asset, _emojiFonts));
                    break;
            }
        }
    }
    return fonts;
}
/**
 * @deprecated use {@link loadFonts} instead
 */
export function preloadRemoteFonts(userFonts, options) {
    return loadFonts(userFonts, options);
}
/**
 * load fonts
 *
 * @param fonts - url path to font files
 * @returns {BeforeBuildFn}
 * @example
 * ```ts
 * // preLoad fonts from remote url (because finto info is not provided)
 * import { init, loadFonts } from 'typst';
 * init({
 *   beforeBuild: [
 *     loadFonts([
 *      'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2', // remote url
 *      'dist/fonts/Roboto-Regular.ttf', // relative to the root of the website
 *     ]),
 *   ],
 * });
 * ```
 * @example
 * ```ts
 * // lazily Load fonts from remote url. The font information is obtained by `getFontInfo`
 * import { init, loadFonts } from 'typst';
 * init({
 *   beforeBuild: [
 *     loadFonts([
 *      {
 *        info: [...]
 *        url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2';
 *      }
 *     ]),
 *   ],
 * });
 * ```
 */
export function loadFonts(userFonts, options) {
    const assetFonts = _resolveAssets(options);
    const loader = async (_, { ref, builder }) => {
        if (options?.fetcher) {
            ref.setFetcher(options.fetcher);
        }
        await ref.loadFonts(builder, [...userFonts, ...assetFonts]);
    };
    loader._preloadRemoteFontOptions = options;
    loader._kind = 'fontLoader';
    return loader;
}
/**
 * preload system fonts
 * @param byFamily - filter system fonts to preload by family name
 * @returns {BeforeBuildFn}
 * @example
 * ```typescript
 * import { init, preloadSystemFonts } from 'typst';
 * init({
 *   beforeBuild: [
 *     preloadSystemFonts({
 *       byFamily: ['Roboto'], // preload fonts by family name
 *     }),
 *   ],
 * });
 * ```
 */
export function preloadSystemFonts({ byFamily }) {
    return async (_, { builder }) => {
        const t = performance.now();
        if ('queryLocalFonts' in window) {
            const fonts = await window.queryLocalFonts();
            byFamily = byFamily ?? [];
            for (const font of fonts) {
                if (!byFamily.includes(font.family)) {
                    continue;
                }
                const data = await (await font.blob()).arrayBuffer();
                await builder.add_raw_font(new Uint8Array(data));
            }
        }
        const t2 = performance.now();
        console.log('preload system font time used:', t2 - t);
    };
}
/**
 * (compile only) set pacoage registry
 *
 * @param accessModel: when compiling, the pacoage registry is used to access the
 * data of files
 * @returns {BeforeBuildFn}
 */
export function withPackageRegistry(packageRegistry) {
    return async (_, { builder }) => {
        return new Promise(resolve => {
            builder.set_package_registry(packageRegistry, function (spec) {
                return packageRegistry.resolve(spec, this);
            });
            resolve();
        });
    };
}
/**
 * (compile only) set access model
 *
 * @param accessModel: when compiling, the access model is used to access the
 * data of files
 * @returns {BeforeBuildFn}
 */
export function withAccessModel(accessModel) {
    return async (_, ctx) => {
        if (ctx.alreadySetAccessModel) {
            throw new Error(`already set some assess model before: ${ctx.alreadySetAccessModel.constructor?.name}(${ctx.alreadySetAccessModel})`);
        }
        ctx.alreadySetAccessModel = accessModel;
        return new Promise(resolve => {
            ctx.builder.set_access_model(accessModel, (path) => {
                const lastModified = accessModel.getMTime(path);
                if (lastModified) {
                    return lastModified.getTime();
                }
                return 0;
            }, (path) => {
                return accessModel.isFile(path) || false;
            }, (path) => {
                return accessModel.getRealPath(path) || path;
            }, (path) => {
                return accessModel.readAll(path);
            });
            resolve();
        });
    };
}
// todo: search browser
// searcher.search_browser().await?;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5pbml0Lm1qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcHRpb25zLmluaXQubXRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWFBOzs7R0FHRztBQUNILE1BQU0saUJBQWlCLEdBQWtCLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQTREL0QsZ0JBQWdCO0FBQ2hCLE1BQU0sVUFBVSxHQUFhO0lBQzNCLHlCQUF5QjtJQUN6QixnQ0FBZ0M7SUFDaEMsNEJBQTRCO0lBQzVCLG9CQUFvQjtJQUNwQiwwQkFBMEI7SUFDMUIsZ0NBQWdDO0lBQ2hDLDRCQUE0QjtJQUM1Qiw2QkFBNkI7SUFDN0IsOEJBQThCO0lBQzlCLG9DQUFvQztJQUNwQyxrQkFBa0I7SUFDbEIsd0JBQXdCO0lBQ3hCLG9CQUFvQjtJQUNwQixxQkFBcUI7SUFDckIsb0JBQW9CO0lBQ3BCLG9CQUFvQjtJQUNwQix1QkFBdUI7Q0FDeEIsQ0FBQztBQUNGLGdCQUFnQjtBQUNoQixNQUFNLFNBQVMsR0FBYTtJQUMxQixxQkFBcUI7SUFDckIsMkJBQTJCO0lBQzNCLHVCQUF1QjtJQUN2Qix3QkFBd0I7SUFDeEIsb0JBQW9CO0lBQ3BCLDRCQUE0QjtDQUM3QixDQUFDO0FBQ0YsZ0JBQWdCO0FBQ2hCLE1BQU0sV0FBVyxHQUFhLENBQUMsdUJBQXVCLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztBQW1DbEc7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8sU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxPQUFpQztJQUNqRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBZ0M7SUFDN0QsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQ0UsT0FBTztRQUNQLE9BQU8sRUFBRSxNQUFNLEtBQUssS0FBSztRQUN6QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU07UUFDdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUMzQixDQUFDO1FBQ0QsSUFBSSxhQUFhLEdBQTJCO1lBQzFDLElBQUksRUFBRSxxRUFBcUU7WUFDM0UsQ0FBQyxFQUFFLHlFQUF5RTtTQUM3RSxDQUFDO1FBQ0YsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsSUFBSSxhQUFhLENBQUM7UUFDN0QsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN2QyxjQUFjLEdBQUcsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUM7UUFDekMsQ0FBQzthQUFNLENBQUM7WUFDTixjQUFjLEdBQUcsRUFBRSxHQUFHLGFBQWEsRUFBRSxHQUFHLGNBQWMsRUFBRSxDQUFDO1FBQzNELENBQUM7UUFDRCxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDNUIsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDaEMsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQWEsRUFBRSxDQUFXLEVBQUUsRUFBRSxDQUM1QyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDdkUsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkMsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZCxLQUFLLE1BQU07b0JBQ1QsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDekMsTUFBTTtnQkFDUixLQUFLLEtBQUs7b0JBQ1IsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsTUFBTTtnQkFDUixLQUFLLE9BQU87b0JBQ1YsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDMUMsTUFBTTtZQUNWLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUNoQyxTQUFrQyxFQUNsQyxPQUFnQztJQUVoQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQ0c7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUN2QixTQUE2QyxFQUM3QyxPQUFnQztJQUVoQyxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0MsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLENBQWtCLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFlLEVBQUUsRUFBRTtRQUN6RSxJQUFJLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUNyQixHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsTUFBTSxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUM7SUFDRixNQUFNLENBQUMseUJBQXlCLEdBQUcsT0FBTyxDQUFDO0lBQzNDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDO0lBQzVCLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsRUFBRSxRQUFRLEVBQTJCO0lBQ3RFLE9BQU8sS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBZSxFQUFFLEVBQUU7UUFDM0MsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTVCLElBQUksaUJBQWlCLElBQUksTUFBTSxFQUFFLENBQUM7WUFDaEMsTUFBTSxLQUFLLEdBR0wsTUFBTyxNQUFjLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFOUMsUUFBUSxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFFMUIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLFNBQVM7Z0JBQ1gsQ0FBQztnQkFFRCxNQUFNLElBQUksR0FBZ0IsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xFLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsZUFBZ0M7SUFDbEUsT0FBTyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFlLEVBQUUsRUFBRTtRQUMzQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLEVBQUUsVUFBVSxJQUFpQjtnQkFDdkUsT0FBTyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxXQUEwQjtJQUN4RCxPQUFPLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBZ0IsRUFBRSxFQUFFO1FBQ25DLElBQUksR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FDYix5Q0FBeUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLHFCQUFxQixHQUFHLENBQ3JILENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLHFCQUFxQixHQUFHLFdBQVcsQ0FBQztRQUN4QyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzNCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQzFCLFdBQVcsRUFDWCxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUNmLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hELElBQUksWUFBWSxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxDQUFDO2dCQUNELE9BQU8sQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxFQUNELENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQ2YsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQztZQUMzQyxDQUFDLEVBQ0QsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDZixPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1lBQy9DLENBQUMsRUFDRCxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUNmLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQ0YsQ0FBQztZQUNGLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBbUJELHVCQUF1QjtBQUN2QixvQ0FBb0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtaWdub3JlXHJcbmltcG9ydCB0eXBlICogYXMgdHlwc3RSZW5kZXJlciBmcm9tICdAbXlyaWFkZHJlYW1pbi90eXBzdC10cy1yZW5kZXJlcic7XHJcbmltcG9ydCB0eXBlICogYXMgdHlwc3RDb21waWxlciBmcm9tICdAbXlyaWFkZHJlYW1pbi90eXBzdC10cy13ZWItY29tcGlsZXInO1xyXG5pbXBvcnQgdHlwZSB7IEZzQWNjZXNzTW9kZWwsIFBhY2thZ2VSZWdpc3RyeSwgUGFja2FnZVNwZWMgfSBmcm9tICcuL2ludGVybmFsLnR5cGVzLm1qcyc7XHJcbmltcG9ydCB0eXBlIHsgV2ViQXNzZW1ibHlNb2R1bGVSZWYgfSBmcm9tICcuL3dhc20ubWpzJztcclxuXHJcbi8qKlxyXG4gKiBzdGFnZWQgb3B0aW9ucyBmdW5jdGlvblxyXG4gKiBAdGVtcGxhdGUgUyAtIHN0YWdlIG1hcmtcclxuICogQHRlbXBsYXRlIFQgLSBjb250ZXh0IHR5cGVcclxuICovXHJcbmV4cG9ydCB0eXBlIFN0YWdlZE9wdEZuPFMgZXh0ZW5kcyBzeW1ib2wsIFQgPSBhbnk+ID0gKHM6IFMsIHQ6IFQpID0+IFByb21pc2U8dm9pZD47XHJcblxyXG4vKipcclxuICogdGhpcyBtYXJrIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGJlZm9yZUJ1aWxkIHN0YWdlXHJcbiAqIEBkZXNjcmlwdGlvbiB3aWxsIG5vdCBiZSB1c2VkIGluIHJ1bnRpbWUgY29kZVxyXG4gKi9cclxuY29uc3QgQmVmb3JlQnVpbGRTeW1ib2w6IHVuaXF1ZSBzeW1ib2wgPSBTeW1ib2woJ2JlZm9yZUJ1aWxkJyk7XHJcblxyXG4vKipcclxuICogdGhpcyBtYXJrIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGJlZm9yZUJ1aWxkIHN0YWdlXHJcbiAqIEBkZXNjcmlwdGlvbiBjYW5ub3QgYmUgY3JlYXRlZCBieSBhbnkgcnVudGltZSBjb2RlXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBCZWZvcmVCdWlsZE1hcmsgPSB0eXBlb2YgQmVmb3JlQnVpbGRTeW1ib2w7XHJcblxyXG4vKipcclxuICogYmVmb3JlIGJ1aWxkIHN0YWdlXHJcbiAqIEBkZXNjcmlwdGlvbiBwb3NzaWJsZSBjcmVhdGVkIGJ5OlxyXG4gKiAgIC0gbG9hZEZvbnRzXHJcbiAqICAgLSBwcmVsb2FkU3lzdGVtRm9udHNcclxuICogICAtIHdpdGhBY2Nlc3NNb2RlbFxyXG4gKiAgIC0gd2l0aFBhY2thZ2VSZWdpc3RyeVxyXG4gKi9cclxuZXhwb3J0IHR5cGUgQmVmb3JlQnVpbGRGbiA9IFN0YWdlZE9wdEZuPEJlZm9yZUJ1aWxkTWFyaz47XHJcblxyXG4vKipcclxuICpcclxuICogQHByb3BlcnR5IHtCZWZvcmVCdWlsZEZuW119IGJlZm9yZUJ1aWxkIC0gY2FsbGJhY2tzIGJlZm9yZSBidWlsZCBzdGFnZVxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBJbml0T3B0aW9ucyB7XHJcbiAgLyoqXHJcbiAgICogY2FsbGJhY2tzIGJlZm9yZSBidWlsZCBzdGFnZVxyXG4gICAqXHJcbiAgICogYmVmb3JlIGJ1aWxkIHN0YWdlLCB0aGUgcmVnaXN0ZXJlZCBmdW5jdGlvbnMgd2lsbCBiZSBleGVjdXRlZCBpbiBvcmRlclxyXG4gICAqIHBvc3NpYmxlIG9wdGlvbnM6XHJcbiAgICogLSBsb2FkRm9udHNcclxuICAgKiAtIHByZWxvYWRTeXN0ZW1Gb250c1xyXG4gICAqIC0gd2l0aEFjY2Vzc01vZGVsXHJcbiAgICovXHJcbiAgYmVmb3JlQnVpbGQ6IEJlZm9yZUJ1aWxkRm5bXTtcclxuXHJcbiAgLyoqXHJcbiAgICogY2FsbGJhY2tzIHRvIGZldGNoIHRoZSB3YXNtIG1vZHVsZSB3cmFwcGVyXHJcbiAgICovXHJcbiAgZ2V0V3JhcHBlcj8oKTogUHJvbWlzZTxhbnk+O1xyXG5cclxuICAvKipcclxuICAgKiBjYWxsYmFja3MgdG8gZmV0Y2ggdGhlIHdhc20gbW9kdWxlXHJcbiAgICpcclxuICAgKiBUaGVyZSBhcmUgbWFueSB3YXlzIHRvIHByb3ZpZGUgYSB3YXNtIG1vZHVsZSwgc2VlXHJcbiAgICoge0BsaW5rIFdlYkFzc2VtYmx5TW9kdWxlUmVmfSBmb3IgbW9yZSBkZXRhaWxzLiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSBhIHdhc21cclxuICAgKiBtb2R1bGUsIHRoZSBkZWZhdWx0IG1vZHVsZSB3aWxsIGJlIHVzZWQuXHJcbiAgICovXHJcbiAgZ2V0TW9kdWxlKCk6IFdlYkFzc2VtYmx5TW9kdWxlUmVmIHwgUHJvbWlzZTxXZWJBc3NlbWJseU1vZHVsZVJlZj47XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIExhenlGb250ID0ge1xyXG4gIGluZm86IGFueTtcclxufSAmIChcclxuICAgIHwge1xyXG4gICAgICBibG9iOiAoaW5kZXg6IG51bWJlcikgPT4gVWludDhBcnJheTtcclxuICAgIH1cclxuICAgIHwge1xyXG4gICAgICB1cmw6IHN0cmluZztcclxuICAgIH1cclxuICApO1xyXG5cclxuLyoqIEBpbnRlcm5hbCAqL1xyXG5jb25zdCBfdGV4dEZvbnRzOiBzdHJpbmdbXSA9IFtcclxuICAnRGVqYVZ1U2Fuc01vbm8tQm9sZC50dGYnLFxyXG4gICdEZWphVnVTYW5zTW9uby1Cb2xkT2JsaXF1ZS50dGYnLFxyXG4gICdEZWphVnVTYW5zTW9uby1PYmxpcXVlLnR0ZicsXHJcbiAgJ0RlamFWdVNhbnNNb25vLnR0ZicsXHJcbiAgJ0xpYmVydGludXNTZXJpZi1Cb2xkLm90ZicsXHJcbiAgJ0xpYmVydGludXNTZXJpZi1Cb2xkSXRhbGljLm90ZicsXHJcbiAgJ0xpYmVydGludXNTZXJpZi1JdGFsaWMub3RmJyxcclxuICAnTGliZXJ0aW51c1NlcmlmLVJlZ3VsYXIub3RmJyxcclxuICAnTGliZXJ0aW51c1NlcmlmLVNlbWlib2xkLm90ZicsXHJcbiAgJ0xpYmVydGludXNTZXJpZi1TZW1pYm9sZEl0YWxpYy5vdGYnLFxyXG4gICdOZXdDTTEwLUJvbGQub3RmJyxcclxuICAnTmV3Q00xMC1Cb2xkSXRhbGljLm90ZicsXHJcbiAgJ05ld0NNMTAtSXRhbGljLm90ZicsXHJcbiAgJ05ld0NNMTAtUmVndWxhci5vdGYnLFxyXG4gICdOZXdDTU1hdGgtQm9sZC5vdGYnLFxyXG4gICdOZXdDTU1hdGgtQm9vay5vdGYnLFxyXG4gICdOZXdDTU1hdGgtUmVndWxhci5vdGYnLFxyXG5dO1xyXG4vKiogQGludGVybmFsICovXHJcbmNvbnN0IF9jamtGb250czogc3RyaW5nW10gPSBbXHJcbiAgJ0lucmlhU2VyaWYtQm9sZC50dGYnLFxyXG4gICdJbnJpYVNlcmlmLUJvbGRJdGFsaWMudHRmJyxcclxuICAnSW5yaWFTZXJpZi1JdGFsaWMudHRmJyxcclxuICAnSW5yaWFTZXJpZi1SZWd1bGFyLnR0ZicsXHJcbiAgJ1JvYm90by1SZWd1bGFyLnR0ZicsXHJcbiAgJ05vdG9TZXJpZkNKS3NjLVJlZ3VsYXIub3RmJyxcclxuXTtcclxuLyoqIEBpbnRlcm5hbCAqL1xyXG5jb25zdCBfZW1vamlGb250czogc3RyaW5nW10gPSBbJ1R3aXR0ZXJDb2xvckVtb2ppLnR0ZicsICdOb3RvQ29sb3JFbW9qaS1SZWd1bGFyLUNPTFIuc3Vic2V0LnR0ZiddO1xyXG5cclxudHlwZSBBdmFpbGFibGVGb250QXNzZXQgPSAndGV4dCcgfCAnY2prJyB8ICdlbW9qaSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIExvYWRSZW1vdGVBc3NldHNPcHRpb25zIHtcclxuICAvKipcclxuICAgKiBwcmVsb2FkIGZvbnQgYXNzZXRzIG9yIGRvbid0IHByZWxvYWQgYW55IGZvbnQgYXNzZXRzXHJcbiAgICogQGRlZmF1bHQgWyd0ZXh0J11cclxuICAgKi9cclxuICBhc3NldHM/OiBBdmFpbGFibGVGb250QXNzZXRbXSB8IGZhbHNlO1xyXG5cclxuICAvKipcclxuICAgKiBjdXN0b21pemUgdXJsIHByZWZpeCBmb3IgZGVmYXVsdCBhc3NldHMgZnJvbSByZW1vdGVcclxuICAgKlxyXG4gICAqIFRoZSBkZWZhdWx0IGFzc2V0cyBhcmUgaG9zdGVkIG9uIGdpdGh1YiwgeW91IGNhbiBkb3dubG9hZCB0aGVtIGFuZCBob3N0XHJcbiAgICogdGhlbSBvbiB5b3VyIG93biBzZXJ2ZXIsIHdoaWNoIGlzIG1vcmUgcHJhY3RpY2FsIGZvciBwcm9kdWN0aW9uLlxyXG4gICAqXHJcbiAgICogSG9zdGVkIGF0OiBodHRwczovL2dpdGh1Yi5jb20vTXlyaWFkLURyZWFtaW4vdHlwc3QvdHJlZS9hc3NldHMtZm9udHNcclxuICAgKiBMaXN0IG9mIGFzc2V0czpcclxuICAgKiBTZWUge0BsaW5rIF90ZXh0Rm9udHN9LCB7QGxpbmsgX2Nqa0ZvbnRzfSwgYW5kIHtAbGluayBfZW1vamlGb250c31cclxuICAgKlxyXG4gICAqIEBkZWZhdWx0ICdqc2RlbGl2ci11cmwgb2YgdHlwc3QtYXNzZXRzIGFuZCB0eXBzdC1kZXYtYXNzZXRzJ1xyXG4gICAqL1xyXG4gIGFzc2V0VXJsUHJlZml4Pzogc3RyaW5nIHwgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcclxuXHJcbiAgLyoqXHJcbiAgICogY3VzdG9tIGZldGNoZXJcclxuICAgKiBOb3RlOiB0aGUgZGVmYXVsdCBmZXRjaGVyIGZvciBub2RlLmpzIGRvZXMgbm90IGNhY2hlIGFueSBmb250c1xyXG4gICAqIEBkZWZhdWx0IGZldGNoXHJcbiAgICovXHJcbiAgZmV0Y2hlcj86IHR5cGVvZiBmZXRjaDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMb2FkUmVtb3RlRm9udHNPcHRpb25zIGV4dGVuZHMgTG9hZFJlbW90ZUFzc2V0c09wdGlvbnMgeyB9XHJcblxyXG4vKipcclxuICogZGlzYWJsZSBkZWZhdWx0IGZvbnQgYXNzZXRzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZURlZmF1bHRGb250QXNzZXRzKCk6IEJlZm9yZUJ1aWxkRm4ge1xyXG4gIHJldHVybiBsb2FkRm9udHMoW10sIHsgYXNzZXRzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIHByZWxvYWQgZm9udCBhc3NldHNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkRm9udEFzc2V0cyhvcHRpb25zPzogTG9hZFJlbW90ZUFzc2V0c09wdGlvbnMpOiBCZWZvcmVCdWlsZEZuIHtcclxuICByZXR1cm4gbG9hZEZvbnRzKFtdLCBvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9yZXNvbHZlQXNzZXRzKG9wdGlvbnM/OiBMb2FkUmVtb3RlRm9udHNPcHRpb25zKSB7XHJcbiAgY29uc3QgZm9udHMgPSBbXTtcclxuICBpZiAoXHJcbiAgICBvcHRpb25zICYmXHJcbiAgICBvcHRpb25zPy5hc3NldHMgIT09IGZhbHNlICYmXHJcbiAgICBvcHRpb25zPy5hc3NldHM/Lmxlbmd0aCAmJlxyXG4gICAgb3B0aW9ucz8uYXNzZXRzPy5sZW5ndGggPiAwXHJcbiAgKSB7XHJcbiAgICBsZXQgZGVmYXVsdFByZWZpeDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICAgICAgdGV4dDogJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9naC90eXBzdC90eXBzdC1hc3NldHNAdjAuMTMuMS9maWxlcy9mb250cy8nLFxyXG4gICAgICBfOiAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3R5cHN0L3R5cHN0LWRldi1hc3NldHNAdjAuMTMuMS9maWxlcy9mb250cy8nLFxyXG4gICAgfTtcclxuICAgIGxldCBhc3NldFVybFByZWZpeCA9IG9wdGlvbnMuYXNzZXRVcmxQcmVmaXggPz8gZGVmYXVsdFByZWZpeDtcclxuICAgIGlmICh0eXBlb2YgYXNzZXRVcmxQcmVmaXggPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGFzc2V0VXJsUHJlZml4ID0geyBfOiBhc3NldFVybFByZWZpeCB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXNzZXRVcmxQcmVmaXggPSB7IC4uLmRlZmF1bHRQcmVmaXgsIC4uLmFzc2V0VXJsUHJlZml4IH07XHJcbiAgICB9XHJcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhc3NldFVybFByZWZpeCkpIHtcclxuICAgICAgY29uc3QgdSA9IGFzc2V0VXJsUHJlZml4W2tleV07XHJcbiAgICAgIGlmICh1W3UubGVuZ3RoIC0gMV0gIT09ICcvJykge1xyXG4gICAgICAgIGFzc2V0VXJsUHJlZml4W2tleV0gPSB1ICsgJy8nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcHJlZml4ID0gKGFzc2V0OiBzdHJpbmcsIGY6IHN0cmluZ1tdKSA9PlxyXG4gICAgICBmLm1hcChmb250ID0+IChhc3NldFVybFByZWZpeFthc3NldF0gfHwgYXNzZXRVcmxQcmVmaXhbJ18nXSkgKyBmb250KTtcclxuICAgIGZvciAoY29uc3QgYXNzZXQgb2Ygb3B0aW9ucy5hc3NldHMpIHtcclxuICAgICAgc3dpdGNoIChhc3NldCkge1xyXG4gICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgZm9udHMucHVzaCguLi5wcmVmaXgoYXNzZXQsIF90ZXh0Rm9udHMpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2Nqayc6XHJcbiAgICAgICAgICBmb250cy5wdXNoKC4uLnByZWZpeChhc3NldCwgX2Nqa0ZvbnRzKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdlbW9qaSc6XHJcbiAgICAgICAgICBmb250cy5wdXNoKC4uLnByZWZpeChhc3NldCwgX2Vtb2ppRm9udHMpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZm9udHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZCB1c2Uge0BsaW5rIGxvYWRGb250c30gaW5zdGVhZFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWRSZW1vdGVGb250cyhcclxuICB1c2VyRm9udHM6IChzdHJpbmcgfCBVaW50OEFycmF5KVtdLFxyXG4gIG9wdGlvbnM/OiBMb2FkUmVtb3RlRm9udHNPcHRpb25zLFxyXG4pOiBCZWZvcmVCdWlsZEZuIHtcclxuICByZXR1cm4gbG9hZEZvbnRzKHVzZXJGb250cywgb3B0aW9ucyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBsb2FkIGZvbnRzXHJcbiAqXHJcbiAqIEBwYXJhbSBmb250cyAtIHVybCBwYXRoIHRvIGZvbnQgZmlsZXNcclxuICogQHJldHVybnMge0JlZm9yZUJ1aWxkRm59XHJcbiAqIEBleGFtcGxlXHJcbiAqIGBgYHRzXHJcbiAqIC8vIHByZUxvYWQgZm9udHMgZnJvbSByZW1vdGUgdXJsIChiZWNhdXNlIGZpbnRvIGluZm8gaXMgbm90IHByb3ZpZGVkKVxyXG4gKiBpbXBvcnQgeyBpbml0LCBsb2FkRm9udHMgfSBmcm9tICd0eXBzdCc7XHJcbiAqIGluaXQoe1xyXG4gKiAgIGJlZm9yZUJ1aWxkOiBbXHJcbiAqICAgICBsb2FkRm9udHMoW1xyXG4gKiAgICAgICdodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tL3Mvcm9ib3RvL3YyNy9LRk9tQ25xRXU5MkZyMU11NG14S0tUVTFLZy53b2ZmMicsIC8vIHJlbW90ZSB1cmxcclxuICogICAgICAnZGlzdC9mb250cy9Sb2JvdG8tUmVndWxhci50dGYnLCAvLyByZWxhdGl2ZSB0byB0aGUgcm9vdCBvZiB0aGUgd2Vic2l0ZVxyXG4gKiAgICAgXSksXHJcbiAqICAgXSxcclxuICogfSk7XHJcbiAqIGBgYFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBgYGB0c1xyXG4gKiAvLyBsYXppbHkgTG9hZCBmb250cyBmcm9tIHJlbW90ZSB1cmwuIFRoZSBmb250IGluZm9ybWF0aW9uIGlzIG9idGFpbmVkIGJ5IGBnZXRGb250SW5mb2BcclxuICogaW1wb3J0IHsgaW5pdCwgbG9hZEZvbnRzIH0gZnJvbSAndHlwc3QnO1xyXG4gKiBpbml0KHtcclxuICogICBiZWZvcmVCdWlsZDogW1xyXG4gKiAgICAgbG9hZEZvbnRzKFtcclxuICogICAgICB7XHJcbiAqICAgICAgICBpbmZvOiBbLi4uXVxyXG4gKiAgICAgICAgdXJsOiAnaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbS9zL3JvYm90by92MjcvS0ZPbUNucUV1OTJGcjFNdTRteEtLVFUxS2cud29mZjInO1xyXG4gKiAgICAgIH1cclxuICogICAgIF0pLFxyXG4gKiAgIF0sXHJcbiAqIH0pO1xyXG4gKiBgYGBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkRm9udHMoXHJcbiAgdXNlckZvbnRzOiAoc3RyaW5nIHwgVWludDhBcnJheSB8IExhenlGb250KVtdLFxyXG4gIG9wdGlvbnM/OiBMb2FkUmVtb3RlRm9udHNPcHRpb25zLFxyXG4pOiBCZWZvcmVCdWlsZEZuIHtcclxuICBjb25zdCBhc3NldEZvbnRzID0gX3Jlc29sdmVBc3NldHMob3B0aW9ucyk7XHJcbiAgY29uc3QgbG9hZGVyID0gYXN5bmMgKF86IEJlZm9yZUJ1aWxkTWFyaywgeyByZWYsIGJ1aWxkZXIgfTogSW5pdENvbnRleHQpID0+IHtcclxuICAgIGlmIChvcHRpb25zPy5mZXRjaGVyKSB7XHJcbiAgICAgIHJlZi5zZXRGZXRjaGVyKG9wdGlvbnMuZmV0Y2hlcik7XHJcbiAgICB9XHJcbiAgICBhd2FpdCByZWYubG9hZEZvbnRzKGJ1aWxkZXIsIFsuLi51c2VyRm9udHMsIC4uLmFzc2V0Rm9udHNdKTtcclxuICB9O1xyXG4gIGxvYWRlci5fcHJlbG9hZFJlbW90ZUZvbnRPcHRpb25zID0gb3B0aW9ucztcclxuICBsb2FkZXIuX2tpbmQgPSAnZm9udExvYWRlcic7XHJcbiAgcmV0dXJuIGxvYWRlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIHByZWxvYWQgc3lzdGVtIGZvbnRzXHJcbiAqIEBwYXJhbSBieUZhbWlseSAtIGZpbHRlciBzeXN0ZW0gZm9udHMgdG8gcHJlbG9hZCBieSBmYW1pbHkgbmFtZVxyXG4gKiBAcmV0dXJucyB7QmVmb3JlQnVpbGRGbn1cclxuICogQGV4YW1wbGVcclxuICogYGBgdHlwZXNjcmlwdFxyXG4gKiBpbXBvcnQgeyBpbml0LCBwcmVsb2FkU3lzdGVtRm9udHMgfSBmcm9tICd0eXBzdCc7XHJcbiAqIGluaXQoe1xyXG4gKiAgIGJlZm9yZUJ1aWxkOiBbXHJcbiAqICAgICBwcmVsb2FkU3lzdGVtRm9udHMoe1xyXG4gKiAgICAgICBieUZhbWlseTogWydSb2JvdG8nXSwgLy8gcHJlbG9hZCBmb250cyBieSBmYW1pbHkgbmFtZVxyXG4gKiAgICAgfSksXHJcbiAqICAgXSxcclxuICogfSk7XHJcbiAqIGBgYFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWRTeXN0ZW1Gb250cyh7IGJ5RmFtaWx5IH06IHsgYnlGYW1pbHk/OiBzdHJpbmdbXSB9KTogQmVmb3JlQnVpbGRGbiB7XHJcbiAgcmV0dXJuIGFzeW5jIChfLCB7IGJ1aWxkZXIgfTogSW5pdENvbnRleHQpID0+IHtcclxuICAgIGNvbnN0IHQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICBpZiAoJ3F1ZXJ5TG9jYWxGb250cycgaW4gd2luZG93KSB7XHJcbiAgICAgIGNvbnN0IGZvbnRzOiB7XHJcbiAgICAgICAgZmFtaWx5OiBzdHJpbmc7XHJcbiAgICAgICAgYmxvYigpOiBQcm9taXNlPEJsb2I+O1xyXG4gICAgICB9W10gPSBhd2FpdCAod2luZG93IGFzIGFueSkucXVlcnlMb2NhbEZvbnRzKCk7XHJcblxyXG4gICAgICBieUZhbWlseSA9IGJ5RmFtaWx5ID8/IFtdO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBmb250IG9mIGZvbnRzKSB7XHJcbiAgICAgICAgaWYgKCFieUZhbWlseS5pbmNsdWRlcyhmb250LmZhbWlseSkpIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZGF0YTogQXJyYXlCdWZmZXIgPSBhd2FpdCAoYXdhaXQgZm9udC5ibG9iKCkpLmFycmF5QnVmZmVyKCk7XHJcbiAgICAgICAgYXdhaXQgYnVpbGRlci5hZGRfcmF3X2ZvbnQobmV3IFVpbnQ4QXJyYXkoZGF0YSkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdDIgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIGNvbnNvbGUubG9nKCdwcmVsb2FkIHN5c3RlbSBmb250IHRpbWUgdXNlZDonLCB0MiAtIHQpO1xyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAoY29tcGlsZSBvbmx5KSBzZXQgcGFjb2FnZSByZWdpc3RyeVxyXG4gKlxyXG4gKiBAcGFyYW0gYWNjZXNzTW9kZWw6IHdoZW4gY29tcGlsaW5nLCB0aGUgcGFjb2FnZSByZWdpc3RyeSBpcyB1c2VkIHRvIGFjY2VzcyB0aGVcclxuICogZGF0YSBvZiBmaWxlc1xyXG4gKiBAcmV0dXJucyB7QmVmb3JlQnVpbGRGbn1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB3aXRoUGFja2FnZVJlZ2lzdHJ5KHBhY2thZ2VSZWdpc3RyeTogUGFja2FnZVJlZ2lzdHJ5KTogQmVmb3JlQnVpbGRGbiB7XHJcbiAgcmV0dXJuIGFzeW5jIChfLCB7IGJ1aWxkZXIgfTogSW5pdENvbnRleHQpID0+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgYnVpbGRlci5zZXRfcGFja2FnZV9yZWdpc3RyeShwYWNrYWdlUmVnaXN0cnksIGZ1bmN0aW9uIChzcGVjOiBQYWNrYWdlU3BlYykge1xyXG4gICAgICAgIHJldHVybiBwYWNrYWdlUmVnaXN0cnkucmVzb2x2ZShzcGVjLCB0aGlzKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJlc29sdmUoKTtcclxuICAgIH0pO1xyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAoY29tcGlsZSBvbmx5KSBzZXQgYWNjZXNzIG1vZGVsXHJcbiAqXHJcbiAqIEBwYXJhbSBhY2Nlc3NNb2RlbDogd2hlbiBjb21waWxpbmcsIHRoZSBhY2Nlc3MgbW9kZWwgaXMgdXNlZCB0byBhY2Nlc3MgdGhlXHJcbiAqIGRhdGEgb2YgZmlsZXNcclxuICogQHJldHVybnMge0JlZm9yZUJ1aWxkRm59XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gd2l0aEFjY2Vzc01vZGVsKGFjY2Vzc01vZGVsOiBGc0FjY2Vzc01vZGVsKTogQmVmb3JlQnVpbGRGbiB7XHJcbiAgcmV0dXJuIGFzeW5jIChfLCBjdHg6IEluaXRDb250ZXh0KSA9PiB7XHJcbiAgICBpZiAoY3R4LmFscmVhZHlTZXRBY2Nlc3NNb2RlbCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgYGFscmVhZHkgc2V0IHNvbWUgYXNzZXNzIG1vZGVsIGJlZm9yZTogJHtjdHguYWxyZWFkeVNldEFjY2Vzc01vZGVsLmNvbnN0cnVjdG9yPy5uYW1lfSgke2N0eC5hbHJlYWR5U2V0QWNjZXNzTW9kZWx9KWAsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBjdHguYWxyZWFkeVNldEFjY2Vzc01vZGVsID0gYWNjZXNzTW9kZWw7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgIGN0eC5idWlsZGVyLnNldF9hY2Nlc3NfbW9kZWwoXHJcbiAgICAgICAgYWNjZXNzTW9kZWwsXHJcbiAgICAgICAgKHBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbGFzdE1vZGlmaWVkID0gYWNjZXNzTW9kZWwuZ2V0TVRpbWUocGF0aCk7XHJcbiAgICAgICAgICBpZiAobGFzdE1vZGlmaWVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsYXN0TW9kaWZpZWQuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAocGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gYWNjZXNzTW9kZWwuaXNGaWxlKHBhdGgpIHx8IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgKHBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIGFjY2Vzc01vZGVsLmdldFJlYWxQYXRoKHBhdGgpIHx8IHBhdGg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAocGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gYWNjZXNzTW9kZWwucmVhZEFsbChwYXRoKTtcclxuICAgICAgICB9LFxyXG4gICAgICApO1xyXG4gICAgICByZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQGludGVybmFsIGJ1aWxkZXJcclxuICovXHJcbnR5cGUgQnVpbGRlciA9IHR5cHN0UmVuZGVyZXIuVHlwc3RSZW5kZXJlckJ1aWxkZXIgJiB0eXBzdENvbXBpbGVyLlR5cHN0Q29tcGlsZXJCdWlsZGVyO1xyXG5cclxuLyoqXHJcbiAqIEBpbnRlcm5hbCBidWlsZCBjb250ZXh0XHJcbiAqL1xyXG5pbnRlcmZhY2UgSW5pdENvbnRleHQge1xyXG4gIHJlZjoge1xyXG4gICAgc2V0RmV0Y2hlcihmZXRjaGVyOiB0eXBlb2YgZmV0Y2gpOiB2b2lkO1xyXG4gICAgbG9hZEZvbnRzKGJ1aWxkZXI6IEJ1aWxkZXIsIGZvbnRzOiAoc3RyaW5nIHwgVWludDhBcnJheSB8IExhenlGb250KVtdKTogUHJvbWlzZTx2b2lkPjtcclxuICB9O1xyXG4gIGJ1aWxkZXI6IEJ1aWxkZXI7XHJcbiAgYWxyZWFkeVNldEFjY2Vzc01vZGVsOiBhbnk7XHJcbn1cclxuXHJcbi8vIHRvZG86IHNlYXJjaCBicm93c2VyXHJcbi8vIHNlYXJjaGVyLnNlYXJjaF9icm93c2VyKCkuYXdhaXQ/O1xyXG4iXX0=