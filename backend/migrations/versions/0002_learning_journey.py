"""Persist preferences and completed connected sessions."""
from alembic import op
import sqlalchemy as sa

revision = "0002_learning_journey"
down_revision = "0001_enterprise_baseline"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("learning_projections", sa.Column("preferences", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column("learning_projections", sa.Column("session_history", sa.JSON(), nullable=False, server_default="[]"))

def downgrade():
    op.drop_column("learning_projections", "session_history")
    op.drop_column("learning_projections", "preferences")
