"""
Risk Scorer (top-level convenience wrapper)
-------------------------------------------
Thin wrapper around ai/risk_scorer/__init__.py so it can be
imported as  `from ai.risk_scorer import predict, explain`
from anywhere in the Backend package.
"""
from ai.risk_scorer import predict, explain  # re-export

__all__ = ["predict", "explain"]
