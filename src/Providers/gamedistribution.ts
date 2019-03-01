/// <reference path='../../vendor/game-distribution.d.ts'/>

import { IProvider } from './ad-provider'
import { AdEvents, AdType, AdWrapper } from '../ad-wrapper'

enum GameDistributionAdType {
    interstitial = 'interstitial',
    rewarded = 'rewarded'
}

export class GameDistribution implements IProvider {
    public adManager!: AdWrapper

    public adsEnabled: boolean = true

    public hasRewarded: boolean = false

    constructor(gameId: string) {
        this.areAdsEnabled()

        ;(window as any).GD_OPTIONS = {
            gameId: gameId,
            advertisementSettings: {
                autoplay: false
            }
        } as IGameDistributionSettings

        //Include script. even when adblock is enabled, this script also allows us to track our users;
        ;(function(d: Document, s: string, id: string): void {
            let js: HTMLScriptElement
            let fjs: HTMLScriptElement = <HTMLScriptElement>d.getElementsByTagName(s)[0]
            if (d.getElementById(id)) {
                return
            }
            js = <HTMLScriptElement>d.createElement(s)
            js.id = id
            js.src = '//html5.api.gamedistribution.com/test/main.js'
            if (fjs.parentNode) {
                fjs.parentNode.insertBefore(js, fjs)
            }
        })(document, 'script', 'gamedistribution-jssdk')
    }

    public setManager(manager: AdWrapper): void {
        this.adManager = manager
    }

    public showAd(adType: AdType): void {
        if (!this.adsEnabled) {
            this.adManager.emit(AdEvents.CONTENT_RESUMED)
        } else {
            if (typeof gdsdk === 'undefined' || (gdsdk && typeof gdsdk.showAd === 'undefined')) {
                //So gdsdk isn't available OR
                //gdsdk is available, but showBanner is not there (weird but can happen)
                this.adsEnabled = false

                this.adManager.emit(AdEvents.CONTENT_RESUMED)

                return
            }

            if (adType === AdType.rewarded && this.hasRewarded === false) {
                this.adManager.emit(AdEvents.CONTENT_RESUMED)

                return
            }

            this.adManager.emit(AdEvents.CONTENT_PAUSED)
            gdsdk
                .showAd(
                    adType === AdType.rewarded
                        ? GameDistributionAdType.rewarded
                        : GameDistributionAdType.interstitial
                )
                .then(() => {
                    if (adType === AdType.rewarded && this.hasRewarded === true) {
                        this.adManager.emit(AdEvents.AD_REWARDED)

                        this.hasRewarded = false
                    }

                    this.adManager.emit(AdEvents.CONTENT_RESUMED)
                })
                .catch(() => {
                    if (adType === AdType.rewarded && this.hasRewarded === true) {
                        this.hasRewarded = false
                    }

                    this.adManager.emit(AdEvents.CONTENT_RESUMED)
                })
        }
    }

    //Does nothing, but needed for Provider interface
    public preloadAd(adType: AdType): void {
        if (this.hasRewarded) {
            return
        }

        gdsdk.preloadAd(GameDistributionAdType.rewarded).then(() => {
            this.hasRewarded = true
            this.adManager.emit(AdEvents.AD_LOADED, adType)
        })
    }

    public adAvailable(adType: AdType): boolean {
        if (adType === AdType.rewarded) {
            return this.hasRewarded
        }

        return true
    }

    //Does nothing, but needed for Provider interface
    public destroyAd(): void {
        return
    }

    //Does nothing, but needed for Provider interface
    public hideAd(): void {
        return
    }

    /**
     * Checks if the ads are enabled (e.g; adblock is enabled or not)
     * @returns {boolean}
     */
    private areAdsEnabled(): void {
        let test: HTMLElement = document.createElement('div')
        test.innerHTML = '&nbsp;'
        test.className = 'adsbox'
        test.style.position = 'absolute'
        test.style.fontSize = '10px'
        document.body.appendChild(test)

        // let adsEnabled: boolean;
        let isEnabled: () => boolean = () => {
            let enabled: boolean = true
            if (test.offsetHeight === 0) {
                enabled = false
            }
            if (test.parentNode) {
                test.parentNode.removeChild(test)
            }

            return enabled
        }

        window.setTimeout(() => {
            this.adsEnabled = isEnabled()
        }, 100)
    }
}
