import { FloatButton } from 'antd';
import { ArrowUp } from 'lucide-react';

export default function BackTop() {
  
  return (
    <FloatButton.Group
      aria-label="ត្រឡប់ទៅលើ"
      className="backtop-responsive"
      icon={<ArrowUp size={18} />}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      
    >
      <FloatButton.BackTop visibilityHeight={400}/>
    </FloatButton.Group>
  );
}


