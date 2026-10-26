"""Frozen enterprise baseline; non-destructive adoption of prototype tables."""
from alembic import op
import sqlalchemy as sa

revision = "0001_enterprise_baseline"
down_revision = None
branch_labels = None
depends_on = None

metadata = sa.MetaData()
sa.Table('auth_rate_limits', metadata,
    sa.Column('key', sa.String(length=64), primary_key=True, nullable=False),
    sa.Column('window_start', sa.Integer(), primary_key=False, nullable=False),
    sa.Column('hits', sa.Integer(), primary_key=False, nullable=False),
)
sa.Table('intelligence_receipts', metadata,
    sa.Column('receipt_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('student_id', sa.String(length=36), primary_key=False, nullable=True, index=True),
    sa.Column('decision', sa.String(length=255), primary_key=False, nullable=False),
    sa.Column('timestamp', sa.DateTime(), primary_key=False, nullable=True),
    sa.Column('confidence', sa.Float(), primary_key=False, nullable=False),
    sa.Column('selection_reason', sa.Text(), primary_key=False, nullable=False),
    sa.Column('observations', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('predictions', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('candidate_actions', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('selected_action', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('constraints_checked', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('assumptions', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('unknowns', sa.JSON(), primary_key=False, nullable=False),
)
sa.Table('item_calibration_history', metadata,
    sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
    sa.Column('question_id', sa.String(length=100), primary_key=False, nullable=False, index=True),
    sa.Column('sample_size', sa.Integer(), primary_key=False, nullable=True),
    sa.Column('empirical_p_value', sa.Float(), primary_key=False, nullable=True),
    sa.Column('difficulty_estimate', sa.Float(), primary_key=False, nullable=False),
    sa.Column('discrimination_estimate', sa.Float(), primary_key=False, nullable=False),
    sa.Column('standard_error', sa.Float(), primary_key=False, nullable=False),
    sa.Column('validation_status', sa.String(length=50), primary_key=False, nullable=False),
    sa.Column('recorded_at', sa.DateTime(), primary_key=False, nullable=True),
)
sa.Table('users', metadata,
    sa.Column('user_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('email', sa.String(length=255), primary_key=False, nullable=False, unique=True, index=True),
    sa.Column('hashed_password', sa.String(length=255), primary_key=False, nullable=False),
    sa.Column('full_name', sa.String(length=255), primary_key=False, nullable=False),
    sa.Column('is_active', sa.Boolean(), primary_key=False, nullable=True),
    sa.Column('created_at', sa.DateTime(), primary_key=False, nullable=True),
)
sa.Table('students', metadata,
    sa.Column('student_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.user_id'), primary_key=False, nullable=True, index=True),
    sa.Column('name', sa.String(length=255), primary_key=False, nullable=False),
    sa.Column('goal', sa.String(length=255), primary_key=False, nullable=True),
    sa.Column('target_exam_date', sa.String(length=50), primary_key=False, nullable=True),
    sa.Column('created_at', sa.DateTime(), primary_key=False, nullable=True),
)
sa.Table('learning_commands', metadata,
    sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.student_id'), primary_key=True, nullable=False),
    sa.Column('command_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('fingerprint', sa.String(length=64), primary_key=False, nullable=False),
    sa.Column('response', sa.JSON(), primary_key=False, nullable=False),
)
sa.Table('learning_projections', metadata,
    sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.student_id'), primary_key=True, nullable=False),
    sa.Column('revision', sa.Integer(), primary_key=False, nullable=False),
    sa.Column('events', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('pending_item', sa.String(length=100), primary_key=False, nullable=True),
    sa.Column('last_view', sa.JSON(), primary_key=False, nullable=True),
    sa.Column('runtime_context', sa.JSON(), primary_key=False, nullable=True),
)
sa.Table('learning_sessions', metadata,
    sa.Column('session_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.student_id'), primary_key=False, nullable=False, index=True),
    sa.Column('topic', sa.String(length=100), primary_key=False, nullable=False),
    sa.Column('subject', sa.String(length=100), primary_key=False, nullable=False),
    sa.Column('session_type', sa.String(length=50), primary_key=False, nullable=False),
    sa.Column('status', sa.String(length=50), primary_key=False, nullable=True, index=True),
    sa.Column('current_phase', sa.String(length=50), primary_key=False, nullable=True),
    sa.Column('target_learning_objective', sa.Text(), primary_key=False, nullable=True),
    sa.Column('pedagogical_action', sa.String(length=100), primary_key=False, nullable=True),
    sa.Column('started_at', sa.DateTime(), primary_key=False, nullable=True),
    sa.Column('completed_at', sa.DateTime(), primary_key=False, nullable=True),
    sa.Column('session_log', sa.JSON(), primary_key=False, nullable=True),
)
sa.Table('state_snapshots', metadata,
    sa.Column('snapshot_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.student_id'), primary_key=False, nullable=False, index=True),
    sa.Column('created_at', sa.DateTime(), primary_key=False, nullable=True, index=True),
    sa.Column('state_json', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('latest_event_id', sa.String(length=36), primary_key=False, nullable=True),
)
sa.Table('student_events', metadata,
    sa.Column('event_id', sa.String(length=36), primary_key=True, nullable=False),
    sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.student_id'), primary_key=False, nullable=False, index=True),
    sa.Column('session_id', sa.String(length=36), primary_key=False, nullable=True, index=True),
    sa.Column('event_type', sa.String(length=100), primary_key=False, nullable=False, index=True),
    sa.Column('payload', sa.JSON(), primary_key=False, nullable=False),
    sa.Column('source', sa.String(length=100), primary_key=False, nullable=True),
    sa.Column('timestamp', sa.DateTime(), primary_key=False, nullable=True, index=True),
)

def upgrade():
    metadata.create_all(op.get_bind(), checkfirst=True)

def downgrade():
    raise RuntimeError("Baseline downgrade would erase learner evidence; restore a verified backup instead")
