// ABOUTME: Static data for Classic Viners to avoid slow API calls
// ABOUTME: This data is precomputed and bundled with the app for instant loading

export interface StaticViner {
  pubkey: string;
  name: string;
  picture: string;
  totalLoops: number;
  videoCount: number;
}

/**
 * Top Classic Viners by total loop count
 *
 * This static data eliminates the need for:
 * 1. Calling the /api/viners endpoint (which returns 404)
 * 2. Falling back to fetching 100 videos and computing viners
 *
 * Data last updated: 2026-01-29
 * Source: Computed from relay.divine.video/api/videos?classic=true
 */
export const CLASSIC_VINERS: StaticViner[] = [
  {
    pubkey: "81acbb70475b8b715c38d072ce93769ca275783d187990117ec0c01ea849bf95",
    name: "KingBach",
    picture: "https://storage.googleapis.com/divine-vine-archive/avatars/93/49/934940633704046592.jpg",
    totalLoops: 614097964,
    videoCount: 208
  },
  {
    pubkey: "2338dd3cf958723782f85c22fddd863ef3ae49ea5277c076450281f5e66f4b4e",
    name: "EhBee.TV",
    picture: "https://media.divine.video/2521611542ef5b08aaeba5d0142d8c6e4299d49321e095685022cfca6dd7ba27",
    totalLoops: 296322418,
    videoCount: 29
  },
  {
    pubkey: "6612831d4adb8ffc44331c1eb4e056bac9a94ee39cd9b6189249652dd21173fd",
    name: "instagram @katieryan430",
    picture: "https://media.divine.video/d5347fc668f2ebb89824e3cd4444c15fd85cd8e08029799e126bf87344991ab9",
    totalLoops: 244967850,
    videoCount: 25
  },
  {
    pubkey: "85ae6817b2e860c678fcd7692cb1142bfb0f3b11ea21ba5b85a93cafb2e49332",
    name: "Twitter: @AFVOfficial",
    picture: "https://media.divine.video/0cd5f5fc417879dc563637c433e9d9a4867f5f94982430352a36a1964e3522e4",
    totalLoops: 196020960,
    videoCount: 63
  },
  {
    pubkey: "bace60e0467300d2e1edf1e81d963c11d2a1d6d7bd4daf70ba1e5d5c8b0546ef",
    name: "Anwar Jibawi",
    picture: "https://media.divine.video/5f1ac1c8fc5dfd131122c80b0c78f63c27140d77a53ee9e71dcda033e33fb387",
    totalLoops: 194476280,
    videoCount: 25
  },
  {
    pubkey: "60068fbead97d5fe3d5c98b1df4021b30ab0ee6aad5539ebec0f0e152a80259d",
    name: "Trench (IG @AcousticTrench)",
    picture: "https://media.divine.video/20ceff935e1edd7a5298f387652f7e49bd124e9958352019920542f432996331",
    totalLoops: 176465780,
    videoCount: 37
  },
  {
    pubkey: "701c877d97718839121058dcb8ec563325a2d64e6d2b5b40a01a197513522bcb",
    name: "Logan Paul",
    picture: "https://media.divine.video/129b88be1fcc82a5448b590fd6785eeef6e73aeecd5a5b99f829ca14734ad587",
    totalLoops: 160036779,
    videoCount: 34
  },
  {
    pubkey: "0339968951cc0ca3e98957af88322ac7c9a2972b961203a8df74ba7b9c372c12",
    name: "Rudy Mancuso",
    picture: "https://media.divine.video/fab015a2145aed738e5d23b1b71f162aa8dbd8bd98bf95ed63b1b92130cdf2b2",
    totalLoops: 159495535,
    videoCount: 35
  },
  {
    pubkey: "5d334682a26ff56ae99186d29d3f4650b304f3a49ea5f00129ae2cf5a82cefec",
    name: "lmao jack (ig: @jack.wmv)",
    picture: "https://media.divine.video/6492fc13a9ac981bfbed789fc280f3c4e6133f60f28e284761f19bbc2811eda0",
    totalLoops: 156186851,
    videoCount: 49
  },
  {
    pubkey: "8b33c201fc25926cb0f50d8fc8ae590ee628b49ecea2776c353949d1ea920946",
    name: "Insta: @RyanPernofski",
    picture: "https://media.divine.video/382356854086eab1faf23e8c9602dcad50bce5c99a731208964db5eb8e9dbd6e",
    totalLoops: 152914872,
    videoCount: 19
  },
  {
    pubkey: "7c8e036b6797d8268427c046f03151e3794c23d5d203007ff870f810388d327d",
    name: "WEIRD Vidz",
    picture: "https://media.divine.video/80bcf0919ed5bb345b0885db3f00271c70deeebf94c24d5b5287e93d6a904945",
    totalLoops: 142699066,
    videoCount: 24
  },
  {
    pubkey: "f9a79374fcf899b66fdd1e8f66c1990d592851d607fd141be3922c8ba4dd44d9",
    name: "Instagram: @Purpdrank",
    picture: "https://media.divine.video/7d49e97d39d23a7c4ef2c100c422b929d21fa0eee60dd7b345926316c38e7022",
    totalLoops: 133360683,
    videoCount: 54
  },
  {
    pubkey: "8094b09fd8612645ba730b250c81e7a84faded244e7549f91784d22d4015f13f",
    name: "IG: @SamuelGrubbs",
    picture: "https://media.divine.video/0f9bf83f31fc12dacdcae71d467595cf723f16ed1e4a76ca4b9ee4a18b46f40f",
    totalLoops: 130963133,
    videoCount: 46
  },
  {
    pubkey: "78709b22f8c6652a06b771154efa7a0d7d2ce2eab1b692b2dbf247a06d4331f3",
    name: "4everkelz",
    picture: "https://media.divine.video/5e5db4895951bc599698168cffae61ed1baa5673626259e1c1d2b8bab032885f",
    totalLoops: 130868257,
    videoCount: 32
  },
  {
    pubkey: "93f8e0a6cb4220a19112c20fb5b0ab29f4d7d2efeeaa538c15bef71c0f9452f1",
    name: "its just luke",
    picture: "/user-avatar.png",
    totalLoops: 120163782,
    videoCount: 8
  },
  {
    pubkey: "6e0f5188eac64e8e00166c1b285bfc27af8ddd873c540942d656405c46dd5ed8",
    name: "Lele Pons",
    picture: "https://storage.googleapis.com/divine-vine-archive/avatars/93/14/931427884873170944.jpg",
    totalLoops: 113148773,
    videoCount: 114
  },
  {
    pubkey: "c821ebd9bfbc6bba292589b7fa3fdc89168fae3a45bc4ea46040b68594927166",
    name: "nick mastodon",
    picture: "https://media.divine.video/57bda34668d9331874979204a52feda3822fe28680afb544cf234461f9aa0df6",
    totalLoops: 112195085,
    videoCount: 42
  },
  {
    pubkey: "49b779887fa2b2a3c1c82f9e07e279d58a61d946d10e4c1560bccbee6bb04d44",
    name: "Brittany Furlan",
    picture: "https://media.divine.video/950b59e937d922cdb2ae9fd1220fae32c5fb160148af06e90ca124e0f31e5c7d",
    totalLoops: 102951695,
    videoCount: 36
  },
  {
    pubkey: "edb803082fc43fb2bbc4a36f62a85debf5d88231880a1594f80d2e5cf951ac65",
    name: "Christine Sydelko",
    picture: "https://storage.googleapis.com/divine-vine-archive/avatars/91/00/910070265105485824.jpg",
    totalLoops: 101388251,
    videoCount: 21
  },
  {
    pubkey: "c1cdd30cbba527363198a507ebef8d44b4ad1178be4a9c534005b35715e8857a",
    name: "Nick Colletti",
    picture: "https://media.divine.video/1c840057f2de449adbc0501cf957274d06908b2439e19862a6b42863792f3826",
    totalLoops: 90060146,
    videoCount: 69
  }
];

/**
 * Get avatar URLs for preloading
 */
export const CLASSIC_VINER_AVATARS = CLASSIC_VINERS.map(v => v.picture).filter(p => p && !p.endsWith('.png'));
