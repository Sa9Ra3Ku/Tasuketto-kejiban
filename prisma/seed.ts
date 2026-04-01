import bcrypt from "bcryptjs";
import { DeepDiveType, PostType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoPasswordHash = bcrypt.hashSync("demo123", 12);

async function main() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000);
  const oneDayAgo = new Date(now.getTime() - 86_400_000);
  const twelveHoursAgo = new Date(now.getTime() - 12 * 3_600_000);
  const oneHourAgo = new Date(now.getTime() - 3_600_000);

  await prisma.savedPost.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.deepDive.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 彩乃: シード上は incomingOverlapsSeenAt なし → /me・ヘッダーで「新しく返ってきた重なり」が試せる
  // 空澄: 流れはあるがほか者からの重なりなし → 返ってきた重なりの空状態デモ用
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: "彩乃",
        email: "ayano@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "健太",
        email: "kenta@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "美咲",
        email: "misaki@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "拓海",
        email: "takumi@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "陽菜",
        email: "hina@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "蓮",
        email: "ren@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "空澄",
        email: "emptyincoming@demo.local",
        hashedPassword: demoPasswordHash,
      },
    }),
  ]);

  const tags = await Promise.all(
    [
      "人間関係",
      "仕事",
      "学習",
      "習慣",
      "将来",
      "お金",
      "健康",
      "SNS",
      "価値観",
      "チーム",
    ].map((name) => prisma.tag.create({ data: { name } })),
  );

  const [ayano, kenta, misaki, takumi, hina, ren, emptyIncoming] = users;
  const tagMap = new Map(tags.map((tag) => [tag.name, tag.id]));

  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: "転職したい気持ちと今の安心感で揺れている",
        body: "今の職場に大きな不満はないけれど、3年後の自分を想像すると成長の実感が薄そうで焦ります。転職サイトを見るたびに気持ちが動くのに、実際に応募する段階で手が止まります。",
        type: PostType.WORRY,
        authorId: ayano.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "朝活が3日坊主になりやすい理由を整理したい",
        body: "朝の時間を使って勉強したいのに、週の後半になると起きられません。気合い不足と決めつける前に、どこでリズムが崩れているのかを言語化したいです。",
        type: PostType.ISSUE,
        authorId: kenta.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "SNSの反応が少ないと発信内容まで疑ってしまう",
        body: "自分では丁寧に書いたつもりの投稿でも反応が少ないと、一気に価値がない気がしてきます。数字の見え方に引っ張られているだけなのかを深掘りしたいです。",
        type: PostType.WORRY,
        authorId: misaki.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "会議が長いチームほど決定が遅い気がする",
        body: "感覚として、発言者が多い会議ほど結論がぼやける気がしています。情報共有と意思決定を同じ場でやっていることが原因ではないか、という仮説があります。",
        type: PostType.DEDUCTION,
        authorId: takumi.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "物価上昇で将来設計が曖昧になってきた",
        body: "毎月の固定費は変わっていないのに、自由に使えるお金が減ってきました。貯金計画の前提がズレている気がしていて、どこから見直すべきか考えたいです。",
        type: PostType.HYPOTHESIS,
        authorId: hina.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "副業を始めるなら今がタイミングか予想したい",
        body: "本業が落ち着いている今のうちに副業を始めるべきか迷っています。忙しくなる前に試したほうがいい気もするし、中途半端になる不安もあります。",
        type: PostType.PREDICTION,
        authorId: ren.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "勉強時間は増えているのに手応えが薄い",
        body: "資格勉強の記録を見ると時間は積めているのに、問題を解くときに詰まります。量ではなく、振り返りの仕方に問題があるのかもしれません。",
        type: PostType.ISSUE,
        authorId: ayano.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "夜に考えごとを始めると不安が増幅する",
        body: "日中はそこまで気にならないことが、夜になると急に重く感じます。疲労のせいか、静かな環境で考えが深まりすぎるのか、原因を見つけたいです。",
        type: PostType.HYPOTHESIS,
        authorId: kenta.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "まだ誰にも読まれていない小さな置き場",
        body: "この流れにはまだ深堀りがありません。",
        type: PostType.WORRY,
        authorId: emptyIncoming.id,
      },
    }),
  ]);

  const postTagRows: Array<{ postId: number; tagName: string }> = [
    { postId: posts[0].id, tagName: "仕事" },
    { postId: posts[0].id, tagName: "将来" },
    { postId: posts[1].id, tagName: "習慣" },
    { postId: posts[1].id, tagName: "学習" },
    { postId: posts[2].id, tagName: "SNS" },
    { postId: posts[2].id, tagName: "価値観" },
    { postId: posts[3].id, tagName: "チーム" },
    { postId: posts[3].id, tagName: "仕事" },
    { postId: posts[4].id, tagName: "お金" },
    { postId: posts[4].id, tagName: "将来" },
    { postId: posts[5].id, tagName: "仕事" },
    { postId: posts[5].id, tagName: "将来" },
    { postId: posts[6].id, tagName: "学習" },
    { postId: posts[6].id, tagName: "習慣" },
    { postId: posts[7].id, tagName: "健康" },
    { postId: posts[7].id, tagName: "価値観" },
  ].filter((row) => tagMap.has(row.tagName));

  await prisma.postTag.createMany({
    data: postTagRows.map((row) => ({
      postId: row.postId,
      tagId: tagMap.get(row.tagName)!,
    })),
  });

  const deepDives = [
    [posts[0].id, kenta.id, DeepDiveType.EMPATHY, "応募ボタンの直前で止まる感覚、すごくわかります。安心を手放す怖さって言語化しづらいですよね。"],
    [posts[0].id, misaki.id, DeepDiveType.PERSPECTIVE, "転職したいより、停滞したくない気持ちが強いのかもしれません。今の職場内で伸ばせる部分も見てみたいです。"],
    [posts[0].id, ren.id, DeepDiveType.HYPOTHESIS, "『応募=今の職場を否定する行為』と無意識で捉えている可能性はありそうです。"],
    [posts[1].id, ayano.id, DeepDiveType.EXPERIENCE, "私の場合は木曜に崩れることが多くて、前夜のスマホ時間が影響していました。"],
    [posts[1].id, takumi.id, DeepDiveType.DEDUCTION, "起きる意思の問題というより、睡眠時間の変動幅が大きいのが原因かもしれないです。"],
    [posts[1].id, hina.id, DeepDiveType.SUMMARY, "週後半で崩れるパターンが鍵ですね。曜日ごとの就寝時刻ログがあると深堀りしやすそうです。"],
    [posts[2].id, kenta.id, DeepDiveType.EMPATHY, "反応の少なさが自己評価に直結する感じ、胸がぎゅっとなります。"],
    [posts[2].id, ayano.id, DeepDiveType.PERSPECTIVE, "届けたい相手が絞れている投稿ほど、総反応は少なくても刺さることがあります。"],
    [posts[2].id, ren.id, DeepDiveType.REBUTTAL, "ただ、完全に数字を無視するのも難しいですよね。改善の手掛かりとしては有効だと思います。"],
    [posts[3].id, misaki.id, DeepDiveType.PERSPECTIVE, "情報共有パートが長いなら、先に非同期で共有して会議では判断だけにする案が見えます。"],
    [posts[3].id, hina.id, DeepDiveType.DEDUCTION, "発言者が多い会議は責任が分散しやすく、決定の重みが薄れるのかもしれません。"],
    [posts[3].id, ayano.id, DeepDiveType.EXPERIENCE, "前職で議題を1つに限定したら、同じ人数でも時間はかなり短くなりました。"],
    [posts[4].id, ren.id, DeepDiveType.EMPATHY, "見積もりが毎月ズレると、計画自体を立てる気力が削られますよね。"],
    [posts[4].id, takumi.id, DeepDiveType.HYPOTHESIS, "固定費ではなく変動費の基準が古い可能性が高そうです。特に食費と日用品。"],
    [posts[4].id, kenta.id, DeepDiveType.SUMMARY, "まず支出を責めるより、前提の更新が必要という視点が共通していますね。"],
    [posts[5].id, ayano.id, DeepDiveType.HYPOTHESIS, "今始めると試行錯誤の余白は取れそうです。ただ本業繁忙期の波を先に見たい気もします。"],
    [posts[5].id, hina.id, DeepDiveType.PERSPECTIVE, "副業の規模を小さく始める前提なら、タイミングの正解不正解は小さくできるかも。"],
    [posts[6].id, misaki.id, DeepDiveType.DEDUCTION, "インプット時間は増えたけどアウトプット密度が薄い、という状態かもしれません。"],
    [posts[6].id, ren.id, DeepDiveType.HYPOTHESIS, "学習直後に3行メモを残すだけでも定着が変わる可能性あります。"],
    [posts[6].id, kenta.id, DeepDiveType.EMPATHY, "時間を投下しているほど、手応えがない時の焦りは大きいですよね。"],
    [posts[7].id, hina.id, DeepDiveType.PERSPECTIVE, "夜は思考のブレーキが弱まるので、仮説が確信っぽく見える時間帯かもしれません。"],
    [posts[7].id, ayano.id, DeepDiveType.EXPERIENCE, "私は夜に悩みを書き出して翌朝読み返すと、重さが半分くらいに感じます。"],
    [posts[7].id, takumi.id, DeepDiveType.SUMMARY, "疲労と環境の両方が関係していそうです。夜は結論を出さないルール化も一案です。"],
  ];

  await Promise.all(
    deepDives.map(([postId, userId, type, body]) =>
      prisma.deepDive.create({
        data: {
          postId: postId as number,
          userId: userId as string,
          type: type as DeepDiveType,
          body: body as string,
        },
      }),
    ),
  );

  const ayanoDiveOnKentaPost = await prisma.deepDive.findFirst({
    where: { postId: posts[1].id, userId: ayano.id },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (ayanoDiveOnKentaPost) {
    await prisma.deepDive.create({
      data: {
        postId: posts[1].id,
        userId: misaki.id,
        parentDeepDiveId: ayanoDiveOnKentaPost.id,
        type: DeepDiveType.PERSPECTIVE,
        body: "彩乃さんの体験に重ねると、曜日ごとに睡眠ログを残すと崩れどころが見えやすそうです。",
      },
    });
  }

  await prisma.savedPost.createMany({
    data: [
      // 彩乃: 手元で新しく動きがある導線デモ用（posts[3]）
      { userId: ayano.id, postId: posts[3].id, createdAt: twoDaysAgo, lastSeenAt: twelveHoursAgo },
      // 彩乃: 保存だけで、まだ新しい動きがない流れ
      { userId: ayano.id, postId: posts[4].id, createdAt: twoDaysAgo },
      { userId: kenta.id, postId: posts[0].id, createdAt: oneDayAgo },
      // 空澄: 手元に置いた流れはあるが、新しい動きはまだないユーザー
      { userId: emptyIncoming.id, postId: posts[8].id, createdAt: oneDayAgo },
    ],
  });

  await prisma.deepDive.create({
    data: {
      postId: posts[3].id,
      userId: kenta.id,
      type: DeepDiveType.PERSPECTIVE,
      body: "手元で見直したくなる流れとして、いまの会議の目的を毎回ひとこと書いておく運用も効くかもしれません。",
      createdAt: oneHourAgo,
    },
  });

  await prisma.savedPost.update({
    where: { userId_postId: { userId: ayano.id, postId: posts[4].id } },
    data: { lastSeenAt: new Date() },
  });

  await prisma.savedPost.update({
    where: { userId_postId: { userId: emptyIncoming.id, postId: posts[8].id } },
    data: { lastSeenAt: new Date() },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
