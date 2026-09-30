// Fotos de placeholder do Unsplash (licença Unsplash: uso livre, inclusive comercial).
// Para usar fotos próprias, coloque os arquivos em /public e troque `src` (ex.: "/fotos/hero.jpg").
// `blurDataURL` é uma prévia borrada (gerada a partir do blurhash da foto) exibida enquanto a imagem carrega;
// pode ser removida sem problema.

export type ImageAsset = {
  src: string
  alt: string
  width: number
  height: number
  blurDataURL?: string
  credit?: { name: string; url: string }
}

const unsplash = (path: string) => `https://images.unsplash.com/${path}?auto=format&fit=crop&w=2400&q=80`

export const images = {
  hero: {
    src: unsplash("photo-1456655010498-adf10969b75f"),
    alt: "Bancada de floricultura repleta de vasos com flores frescas coloridas sob luz natural",
    width: 5760,
    height: 3840,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAABRklEQVR42gXBSW4VQRAE0MiIzO4/mEFmC0s2nIArcP+DgASS3VU58J7h5y8Evz+Prx/O10c8D4mTne/X+7/3t79vb9da6rlLD4/T3SG8EE/OaX3YBFsEMeNItwpqZNVBc0IG/3H2XfgS9dnzo9vd5bKeWeRpftN5BTtbQMCc499uHZqPBz4FPvjcXOEawz74OI7H0rUjd061dXPaX89y2TPmxfvpfXePGEgJrdIZfu1eK3PtyUSNP2Kcc9Oc7INzECGaPEjJKYgtcA9ypqecBhrMBjAMZoAxgxkkSmNii0iWGQH5bmsY27zo5VY+JZowLLAa1VZj1cxmNf1fSkRCbWrFtjhweDvIBrKx9lx7VmIVs+R/NmV2jl8WF+OOOBFeIm2Aqt45a89aWNsy5b83RbuZNrXpy+IGhSgCM92T2Tt75ay0LP4HP/fEzmsfsBMAAAAASUVORK5CYII=",
    credit: { name: "Alisa Anton", url: "https://unsplash.com/photos/TBaEUj5-J7Q" },
  },
  about: {
    src: unsplash("photo-1554196259-e3c00b41a421"),
    alt: "Florista montando à mão um arranjo com flores de várias cores sobre a bancada",
    width: 3600,
    height: 2403,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAABQklEQVR42gXBQW5UMRAE0Oq2f/JnQICC2HJTVpyAM7IDRSgZJR7bXVW8F79+/rClXVzTc+Seh+pMXB6O87wcl2ueVz9e6uGsdlS2XqQtiZJgB2zAgAzaadu2RJGRiui3MWCDBe5kdSns7UgZVO2K3I4Ugl1U9b+vLwE067AO89FGAADptZjYQNgSy0dXy/77+bkFzoxrxoeWymBmZUsxBMgmXRtHw9HQou1vX27jrdY9WCGFbaDsJQ/pnfXOGtp3ram5ONu/03/Gm2o9mN2GLbvkKQ5yqIbqrrW0NufmatAN8+XV/AwcQFi2StziVE3X8i5XeVOb3A0dMID7R+CwQpSKJl0MKugQIFiQJTU8NfT4BFw4Ww3wbi+jkIrm1pAtMpARMKDo369PkLJG7ve1du4N3yLPPL52OxENLaLBYaQd/wEl2zxZ+cV2+QAAAABJRU5ErkJggg==",
    credit: { name: "Artsy Vibes", url: "https://unsplash.com/photos/5yYuBoXpBUI" },
  },
  cta: {
    src: unsplash("photo-1587317996394-bc283f1167e2"),
    alt: "Baldes com tulipas vermelhas e amarelas esperando para serem arranjadas no ateliê",
    width: 5734,
    height: 3584,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAIAAAAy3EnLAAABAUlEQVR42i2My21cQRDEWD2zwTgVOf8wDFiQtZ833VU+rABeCBDUx+9forbWrW63dbvtvffSLlYGH/ezz+N17o/X9+N6PrtAb4QKfjwhEBL4QYqEdliSpCq00ArLSJgMwaTxEEvRovZ7+t6vsMJyIDEkdubgJoOsinYogpBATmEZBO9+7I5PfHDDsJMEJQmJ7ImUwMDYY09PH/c1c7nbO7ZhosYnBRoqMKGTmemeOX2ufr7OuXrH7dCRrFidKgQyNJ6xu/s61+P6vr++7teOL0KPPOqpshYlCWGl7Zkz53o9n3/+3r8+vzc+jjDdRatcK1VVtUBxJjPT53o9vz7/Af8BNeD6N54wEikAAAAASUVORK5CYII=",
    credit: { name: "Zoe Richardson", url: "https://unsplash.com/photos/uhOdDbo7GTU" },
  },
  peonias: {
    src: unsplash("photo-1558021843-f9ab317ed0eb"),
    alt: "Buquê de peônias cor-de-rosa com folhagens, segurado contra um fundo claro",
    width: 3456,
    height: 5184,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABJUlEQVR42jXEwWHbQBADQAC7R6r/ctJAikgZjiyTvAXyyjyGf37/kmqts6oxuK/r8/19PdcW8Drq9erECR3LQZL8HyRIoO/nKQUoFmF478zAhkRAUv9cP6V2krKMue95nsxAFCmp39/vqvYY7TLmfua+HHNJZFf11/tvV2c7vVeYe+/nNqFziSxVf72/Vi9sY21DuPfsnVVKSKrUfz/vo5YmehyIz7ZNnpWAFNWf6zO1O+wOIo4B1OqVBATZe4bhzfsaIpJDacUDhAjQIAOMfftBSEO9AAwwySTd6ygw4HYyYViAyE0OMHGfx8mAhhMjAEsqapM72XafxwtJHnu24ZCWurTJDWy7j+OMPdneGWWgSMMacpKxu6tNW4G2SYNDWTRgwMk/RGb6mKVwiBIAAAAASUVORK5CYII=",
    credit: { name: "Liubov Ilchuk", url: "https://unsplash.com/photos/kYNLtWunw8M" },
  },
  rosasRosa: {
    src: unsplash("photo-1490072823515-ffd82c9aec9d"),
    alt: "Buquê de rosas cor-de-rosa em tons suaves, fotografado de perto",
    width: 5042,
    height: 2836,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAABPklEQVR42m3OS0/CQAAE4NlnWwVswQhqTDQaY+LNg///R3DQeBaCwVq63Vd36XoAb07mOF8yBP9kAkyAU0ACHEhABDxgAc3/RjlQYTFGdfpYFCOeUQgf6daltQ749ujMQf4Ben3/cvm8mC3Ks8nJSc4zAhbCoF34UWa965bbZrNi+MYRPDxVrzfzu6vFfDotR+NcZiTRvo+dcfVOnddNKek7jcvUH8FtWczPxvOqvJxNy/EklxlJpO+D6qygJO1j74zWua7EEWSSSsGkYOJQzkgiw37gjHBGOANnRHAU8nApYzbtbexN77SznLEgAhmI90Fpo4zurFXequi3CBwARnIV3IVuiyYfkLQ1kgkM8C4obetWbZrdZ9t8WPUVDQcFBH/zZqZ2jFMX/EhmgvIUk/NRaVcrvVJq2bW1bhH1Lz6/rESB0E+KAAAAAElFTkSuQmCC",
    credit: { name: "Caroline Attwood", url: "https://unsplash.com/photos/3_v0K6vAFa4" },
  },
  tulipas: {
    src: unsplash("photo-1586973699006-2a096c90f847"),
    alt: "Mãos segurando um buquê de tulipas, narcisos e ranúnculos em tons de primavera",
    width: 4000,
    height: 6000,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABMElEQVR42kWQy25bMRBDORIl2Qn6/79ZtLGtq3mwCycotzwgSNrvxzbAlEgv33G90o/Q+rzPj1/j9kkAgABJUpWqqkqGBgkCwP9eRoR7nPCD1o0pCShCgkqVEeecffYr/FgfxlWVggiUVJnufl37uV9f7t65bNxWhlSUSpUZ7tfer8fz8dfduZL3j6w3UVWVGX7O3vvxev45ERO4+clKKVmZ+e54rms/9356BDgjoyqlYmZkRIS7H/fjfkXWyKzv5WLEm8i3SoIZzH5eKoZHZmZklmCttdHMyNlaN5kK9IjMiCzJWhtj3q21ORb7MDNJdI/K74DONYHOvtZ9cJg1FeieqqoCrPexyE7ytu7kbNYlMLLwQ5CzGSc55iJp1iBjZUESYNZaJ5s4Bjt76wYD8A/rnTcxsVMF3gAAAABJRU5ErkJggg==",
    credit: { name: "Zoe Richardson", url: "https://unsplash.com/photos/isLn_yy6rYs" },
  },
  kraft: {
    src: unsplash("photo-1562168138-666ded66591d"),
    alt: "Buquê de flores do campo embrulhado em papel kraft pardo",
    width: 3555,
    height: 5536,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAQCAIAAACgHXkXAAABLUlEQVR42i3NSU5DMRAFwNeD/X8SBgnBORD3vxNiQ2L3yAap9kWfXzjm7eX2frs9D53ZWBb3vZatKFMABGJiIRZmFCmXMgtzNysBTDpEp4xDZzURqLK7y7mVSIR1yriOec6jwUpKTURl0QqI0Dh0XMZxnSeIlQMAUMKtBBGSKeMy5nUeIGGO6q4O4tBuYRJlnTrOMYmFiCPT0wpDq4EmIVaWIUKs1ZiqQ9RTNBPVBBATMTEzMTET/fPMzKrqqu7ubgANoBvd0O3hUR7lkR4poMzKrKyKKP013+7msT22h3ZbpkW4h3vq98aH+cP8YTbNtMQzt/m2WObSgsuU18vTeUwRLvSOeJjd17ovEyTorLfr83lMESmUZ6xtv2vf11YEfizW/+2Nzk6P8Ejz/AN7X+I3NDYo9wAAAABJRU5ErkJggg==",
    credit: { name: "Devon Divine", url: "https://unsplash.com/photos/u2ast8gVEzw" },
  },
  rosasBrancas: {
    src: unsplash("photo-1557925923-6885735abfb1"),
    alt: "Buquê de rosas brancas e champanhe com folhagens verdes",
    width: 2632,
    height: 3939,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABJUlEQVR42jWPQW4cQQwDqW7NrBf+/3/8hiAfCZL1TrdEMoeBCZ6ryPj69dsSu7gWa7Oad7pZze4BAEDYAGzb+qkNA8iAAQOAZVFsdrFJyjLgDANGWBDV1XXtvdm0IxwRI8OGHbZF9a713te7W8DIec555LBlQwJbvep6Xd//ujjmAydGzIQdVohWs1at13r9qeLMz4n0PDMkS5BAqnev7/3+u1fniTOfOpmWIduyaLZq9fWq1fDRH5vdadGif0im3K29GJt7sypF2bIMA45AhEcIbqq7q1KiJck2gDHiyPmYQTjY7KrkDbeNiMg5H5nPTAnTVO9KSbZkAxEjMx/H8exU05Zvy/0ExoiYY56ZH3m03LTJHoYN3ysi5hg55zHHMcaEIeo/wAtb8GTV+4EAAAAASUVORK5CYII=",
    credit: { name: "Alina Karpenko", url: "https://unsplash.com/photos/WCkWGoHHNOM" },
  },
  tropical: {
    src: unsplash("photo-1571780881855-f537064b892b"),
    alt: "Buquê de flores tropicais em tons de laranja, coral e vermelho",
    width: 4160,
    height: 6240,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABW0lEQVR42gXBW27bMBAF0HmSFKPYQPe/lX51Id1AAxSxa0vizNyew79//YQQVGAqokoqkIQczA+mp7ABheLiQhJATEREIAIJiAmwyixGJCUTs6aospNYipZwgiziStSVeVUR2NSaD/a+zEMkmW1dR1S+j/N1XlVo3sa2+6wEQjVYbK1jrXg9n9/fj7Wyj22/5yYM5kALYst1rvN6P74fX3+O49w+bqIqY4i3IA4Sy1i5zuv9fP39ej3/VcS4ffa4rKJKCxCqREXFtc7X9X6udVQGUAAIIJQIszCLiJppa+pNzERVRERYmM1U3byPMW93atu838ecrTU1S1UlsuYNoO3jc/9RLXLs97nf+ti4tWQ1hjXvxDp3hFqA+9z3222MCe/J7FLm3lktRNBHirY+59x9bKm+AJc0d2foMCVCibe29T7Ve4hYlSabihHBTBszzN1H88bqYFJiJfwHQ03PrLgr/GsAAAAASUVORK5CYII=",
    credit: { name: "Kelsey Curtis", url: "https://unsplash.com/photos/83pLp9UpWtw" },
  },
  catRosas: {
    src: unsplash("photo-1516565349308-c76fe36a115c"),
    alt: "Arranjo de rosas vermelhas aveludadas em fundo escuro",
    width: 6016,
    height: 4016,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAAAxElEQVR42lWRQbLlMAgDu8HJv/95E1uzcPIqQ/UOYYQs/1dDS0OBIbDggvsVjJ+0PuoGAUmelpA9IAgDDjiktVUwLFhwkyTrXTIGFJ7wVx46tJ/HmTATk7BhktHUgENPPXWUhcoKlW0q68U4CktaC1vbavcKIAtqExoiFdhsCe9xv8oHoAvdEYnvzIKZzDCTO7mTSWayoLfFRyqBCbt9Z13JA7lgEn+fcMqhh5TKk8skV7iS67Xk164ypNz5kLB2uJ/D/gGhf385puWduQAAAABJRU5ErkJggg==",
    credit: { name: "Alessio Soggetti", url: "https://unsplash.com/photos/KQBsTXCvGwM" },
  },
  catCampo: {
    src: unsplash("photo-1589923190658-c7250dd0350a"),
    alt: "Baldes com ranúnculos cor-de-rosa, amarelos e roxos recém-colhidos",
    width: 3000,
    height: 2000,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAIAAAD5gJpuAAAA/0lEQVR42k3QS27DMAyE4X8kynJ6/3N0WfRQdVKkT8QWpwvHaNbExxlSz68vxmDbdtqJDcYAmH0EaadxYAsbY8ve4QMwIGwjAIXGtk9k39cfIdoNttDuILTeDPJjyMGwAEmSi1CRiPz92av6OAQnOXaAoIhSqZVSKSXWr0/AyICxk7wDkQjVQg2iEUGp8f1xBfgHJgc55IFTBWqlNbWJmKgR18sFQOJoRQ5yUw5IFYhQm5g6rRMR5+UNCfZHgFM5yI2xiURSa0yd3pk60WJZFoACErKc5KaxMVY5KUVtos/MM70TLS7vZxAFVZDF0Fg1VrabMimVNut0Yn3i1mntD++UwKEzQadiAAAAAElFTkSuQmCC",
    credit: { name: "Zoe Richardson", url: "https://unsplash.com/photos/J8YByQQ7qXM" },
  },
  catOrquideas: {
    src: unsplash("photo-1551567676-94fef02ca1b4"),
    alt: "Orquídeas phalaenopsis cor-de-rosa em foco seletivo",
    width: 3063,
    height: 4594,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABN0lEQVR42kXCSXYUUQwEwNRQ3eb+94Idx8Dgrq7hS8pk6XhhP3/9Ro/uW9cCiUw8H9qS0NSadadIiJIggt9lkgQp1aUZdGEKQ0BwEySTusjKXidI1I0qG6IbHHXSNaqZyr52kFhla1nTFFgbIzrU3oPKdXyBtC5f7UWMAzERvam3mZi89k+DfNprYhHLNE73eqI+OM/J8/1pUmiiGTftAhfGrD5Qg6by2P+YIaUk46Id4qEG1g8UrIHc33/dkIZNiIs4hu+p0RpUervn63y5Y3PbZLmI1X119dyGekSH5+s+3W1ze8CiqemeWl33jXXGROS/7jB7hD1gMaK6vC/ri6zbxyO/RmF4yh6GkMZwJw7iglaRQL7oaVawp5vL2v1M3+nHqEai8oQnTIJkBiu3I/wVvkurCeE/+oU0Gy3iD5IAAAAASUVORK5CYII=",
    credit: { name: "Cole Keister", url: "https://unsplash.com/photos/z5Cei2ErjuQ" },
  },
  catMesa: {
    src: unsplash("photo-1561181286-d3fee7d55364"),
    alt: "Arranjo de mesa com flores cor-de-rosa em vaso de vidro transparente",
    width: 3752,
    height: 5628,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABHUlEQVR42j2QQZYbQQxCkUDVnvtfNBt73N0lkYWdsAbeh/jzsuHu7tndPR4YQEQEEIEQABiAbdvjGRiIgCMiHRBgYDwzvXvf3Q0jIiKZyYgU8Inu3td9nXtv2BGkihRJwQPPzN73eb1f93XZJku1sI6AFBi4p+++3tf7eb5/PaDW8fjJjMwPh8e9933e7+f5es641k9mqCSmwgOPZ09f9/V7nc9p266q6cOuzxZ/UKbv3me3k5remIYnAcTnIxhhw8YARhiBDCjwfTCSSabkmCTznxRAIDKTEteq48i21mIVqUzpfwFVtR7VzZ6qh2pJRX4dmUlq6Xgsu2eKq9aixKQCAXw7VEfZOaMsapFKSl/OzEhS4hRmmEoykxn5F68axdYP5LufAAAAAElFTkSuQmCC",
    credit: { name: "Uljana Borodina", url: "https://unsplash.com/photos/NFj6pEUdmpY" },
  },
  catPresentes: {
    src: unsplash("photo-1560583035-79c3e11ae176"),
    alt: "Caixa de presente com rosas cor-de-rosa",
    width: 3648,
    height: 5472,
    blurDataURL:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAIAAABP3xIpAAABL0lEQVR42i2QW46TUQyDnZx0VGChLIENsTs0wEP/nksSex5aS37yZ1my/f75q8Ey8ebx7X7//uP+cQcw5/z7//Pz3x8XBACQIEAGwGAwexkWACQJAt+wveTu7sM9CAoSBb6hV9uHjzFiRFAkJVENUIZ37MPHC6KaUjchqAXJYObvkfARxWaTRThUBAUIgBnMzc0jO9Vi0d1YraYoSAIgQIhTqZZKYcZqVrPb2tgttsg4ddRCAmad3dmdBUNnVVZlxTobLUuHeWXVqdpJMXPnPuecWGehMWqYj8rqk7WOtZ/ce641V8y9jBZ98/FRWbkzYiNtn7Wu57yesc5yOmU3VFXXznSXa++5rufzccU+2zVgUcau7lNlJjDXXI85H1dUpUPh/bqf1TSjulbm3OeaX2GbMfnt/DtAAAAAAElFTkSuQmCC",
    credit: { name: "Ellie Ellien", url: "https://unsplash.com/photos/5U_-iTN0VEc" },
  },
} satisfies Record<string, ImageAsset>
