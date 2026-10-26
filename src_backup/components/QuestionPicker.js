import Dropdown from './Dropdown';
import { SECURITY_QUESTIONS } from '../utils/security';

const OPTIONS = (SECURITY_QUESTIONS || []).map((q) => ({ label: q, value: q }));

export default function QuestionPicker({ value, onChange }) {
  return (
    <Dropdown
      icon="help-circle-outline"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      placeholder="Choose a recovery question"
    />
  );
}
