const TermsPage = () => (
  <div className="max-w-2xl mx-auto py-10 px-4">
    <h1 className="text-2xl font-bold mb-6">利用規約</h1>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第1条（適用）</h2>
      <p>
        本利用規約（以下「本規約」といいます）は、当アプリ（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第2条（利用目的）</h2>
      <p>
        本サービスは、個人の家計管理・貯金管理を目的としたものであり、商用利用や第三者への再配布は禁止します。
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第3条（データ管理）</h2>
      <p>
        本サービスで登録・記録されたデータは、ユーザー自身の責任で管理してください。万が一データの消失や損害が発生した場合、運営者は一切の責任を負いません。
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第4条（禁止事項）</h2>
      <ul className="list-none pl-6">
        <li>法令または公序良俗に違反する行為</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>他のユーザーまたは第三者に不利益・損害を与える行為</li>
        <li>不正アクセスやシステムへの攻撃行為</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第5条（免責事項）</h2>
      <p>
        本サービスの利用により生じた損害について、運営者は一切の責任を負いません。サービス内容は予告なく変更・停止する場合があります。
      </p>
    </section>
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">第6条（規約の改定）</h2>
      <p>
        本規約は必要に応じて改定されることがあります。改定後の規約は本サービス上に掲載した時点で効力を生じます。
      </p>
    </section>
    <div className="text-right text-sm text-gray-500 mt-8">制定日：2024年6月</div>
  </div>
);

export default TermsPage; 