
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, CheckCircleIcon, Cog6ToothIcon } from '../components/icons';

const Home: React.FC = () => {
  const FeatureCard: React.FC<{ to: string, icon: React.ReactNode, title: string, description: string }> = ({ to, icon, title, description }) => (
    <Link to={to} className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="bg-yamori-accent/10 p-3 rounded-lg text-yamori-accent group-hover:bg-yamori-accent group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-yamori-dark">{title}</h3>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-yamori-dark sm:text-4xl">ようこそ</h2>
        <p className="mt-4 text-lg text-gray-600">書籍貸出管理システムで、蔵書を効率的に管理しましょう。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
        <FeatureCard 
          to="/rental" 
          icon={<BookOpenIcon className="w-8 h-8"/>} 
          title="貸出 / 返却" 
          description="書籍の貸出と返却手続きを行います。" 
        />
        <FeatureCard 
          to="/inventory" 
          icon={<CheckCircleIcon className="w-8 h-8"/>}
          title="在庫チェック" 
          description="書籍の在庫状況を確認し、記録します。" 
        />
        <FeatureCard 
          to="/admin" 
          icon={<Cog6ToothIcon className="w-8 h-8"/>} 
          title="書籍管理" 
          description="新しい書籍の登録や、既存書籍の情報を管理します。" 
        />
      </div>
    </div>
  );
};

export default Home;
