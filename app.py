"""
HW1: 網格地圖開發 + 策略顯示與價值評估
Flask Web Application for MDP Grid World
"""
import random
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ─── Constants ───────────────────────────────────────────────────────────────
ACTIONS = {
    'up':    (-1, 0),
    'down':  (1, 0),
    'left':  (0, -1),
    'right': (0, 1),
}
ACTION_NAMES = list(ACTIONS.keys())

GAMMA = 0.9          # discount factor
THETA = 1e-6         # convergence threshold
REWARD_GOAL = 1.0
REWARD_OBSTACLE = -1.0
REWARD_STEP = -0.04  # living penalty


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/evaluate', methods=['POST'])
def evaluate():
    """
    Receive grid state (n, start, end, obstacles),
    generate a random policy, run policy evaluation, and return results.
    """
    data = request.get_json()
    n = int(data['n'])
    start = tuple(data['start'])          # (row, col)
    end = tuple(data['end'])              # (row, col)
    obstacles = [tuple(o) for o in data['obstacles']]  # list of (row, col)

    # ── Random policy generation ─────────────────────────────────────────
    policy = {}
    for r in range(n):
        for c in range(n):
            cell = (r, c)
            if cell == end or cell in obstacles:
                policy[cell] = None  # terminal / blocked
            else:
                policy[cell] = random.choice(ACTION_NAMES)

    # ── Policy evaluation ────────────────────────────────────────────────
    V = np.zeros((n, n), dtype=float)

    for _ in range(10000):  # safeguard max iterations
        delta = 0.0
        for r in range(n):
            for c in range(n):
                cell = (r, c)
                if cell == end or cell in obstacles:
                    continue  # V stays 0 for terminal / obstacles

                action = policy[cell]
                dr, dc = ACTIONS[action]
                nr, nc = r + dr, c + dc

                # boundary check – stay in place if hitting wall
                if nr < 0 or nr >= n or nc < 0 or nc >= n:
                    nr, nc = r, c

                # obstacle check – stay in place if hitting obstacle
                if (nr, nc) in obstacles:
                    nr, nc = r, c

                # reward
                if (nr, nc) == end:
                    reward = REWARD_GOAL
                elif (nr, nc) in obstacles:
                    reward = REWARD_OBSTACLE
                else:
                    reward = REWARD_STEP

                new_v = reward + GAMMA * V[nr, nc]
                delta = max(delta, abs(new_v - V[r, c]))
                V[r, c] = new_v

        if delta < THETA:
            break

    # ── Build response ───────────────────────────────────────────────────
    policy_matrix = []
    value_matrix = []
    for r in range(n):
        policy_row = []
        value_row = []
        for c in range(n):
            p = policy[(r, c)]
            policy_row.append(p if p else '')
            value_row.append(round(float(V[r, c]), 2))
        policy_matrix.append(policy_row)
        value_matrix.append(value_row)

    return jsonify({
        'policy': policy_matrix,
        'values': value_matrix,
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
