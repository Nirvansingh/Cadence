import React, { useState } from 'react';
import type { FriendProfile, FriendQuest, CheerActivity } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  UserPlus, 
  Flame, 
  Award, 
  Copy, 
  Check, 
  Bell, 
  Sparkles, 
  TrendingUp, 
  X 
} from 'lucide-react';

interface FriendsModuleProps {
  soundEnabled: boolean;
  onOpenStreakStudio: () => void;
}

export const FriendsModule: React.FC<FriendsModuleProps> = ({
  soundEnabled,
  onOpenStreakStudio
}) => {
  const [friends, setFriends] = useState<FriendProfile[]>(() => storage.getFriends());
  const [quests] = useState<FriendQuest[]>(() => storage.getFriendQuests());
  const [cheers, setCheers] = useState<CheerActivity[]>(() => storage.getCheers());
  
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'quests' | 'activity'>('leaderboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const myProfile = friends.find(f => f.isCurrentUser) || friends[0];

  // Sort friends by weekly focus minutes descending
  const sortedLeaderboard = [...friends].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  const handleCopyCode = () => {
    if (myProfile?.friendCode) {
      navigator.clipboard.writeText(myProfile.friendCode);
      setCopiedCode(true);
      playClickSound(soundEnabled);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    const success = storage.addFriend(friendCodeInput);
    if (success) {
      playSuccessChime(soundEnabled);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#10b981', '#f59e0b']
      });
      setFriends(storage.getFriends());
      setFriendCodeInput('');
      setIsAddModalOpen(false);
      setAddError(null);
    } else {
      playClickSound(soundEnabled);
      setAddError('Friend already added or invalid code.');
    }
  };

  const handleSendCheer = (friendId: string, type: 'high_five' | 'streak_fire' | 'nudge') => {
    const success = storage.sendCheer(friendId, type);
    if (success) {
      playSuccessChime(soundEnabled);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6']
      });
      setFriends([...storage.getFriends()]);
      setCheers([...storage.getCheers()]);
    }
  };

  return (
    <div className="animate-quiet module-container">
      {/* Header Banner: Social Profile & Friend Code */}
      <div className="panel-interactive" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 28px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-hairline)',
        marginBottom: '26px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {myProfile?.avatarEmoji || '⚡'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-pure)', margin: 0 }}>
                {myProfile?.displayName || 'You'}
              </h2>
              <button
                onClick={onOpenStreakStudio}
                title="View Streak Studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--amber-subtle)',
                  color: 'var(--amber)',
                  border: '1px solid var(--amber-border)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }} className="mono"
              >
                <Flame size={12} fill="var(--amber)" />
                <span>{myProfile?.streak || 0}d</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Friend Code:
              </span>
              <button
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-pure)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }} className="mono"
              >
                <span>{myProfile?.friendCode}</span>
                {copiedCode ? <Check size={11} color="var(--emerald)" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>

        {/* Add Friend CTA */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--sky)',
              color: '#090b10',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            <UserPlus size={15} strokeWidth={2.5} />
            <span>Add Friend</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
        {[
          { id: 'leaderboard', label: 'Weekly League', icon: <Award size={14} /> },
          { id: 'quests', label: 'Friend Quests', icon: <Sparkles size={14} />, badge: quests.filter(q => !q.isCompleted).length },
          { id: 'activity', label: 'High-Fives & Activity', icon: <Bell size={14} />, badge: cheers.length }
        ].map(tab => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12.5px',
                fontWeight: isSel ? 600 : 500,
                backgroundColor: isSel ? 'var(--bg-subtle)' : 'transparent',
                color: isSel ? 'var(--text-pure)' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: isSel ? 'var(--border-subtle)' : 'transparent',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--sky-subtle)',
                  color: 'var(--sky)',
                  fontSize: '10px',
                  fontWeight: 700
                }} className="mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* View 1: Weekly Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="panel-card" style={{ padding: '20px 24px', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)' }}>
                Weekly Study Standings
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Ranked by focus minutes logged this week • Resets Sunday at midnight
              </p>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono'
            }}>
              <TrendingUp size={12} />
              Live Leaderboard
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedLeaderboard.map((friend, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;
              const medal = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${rank}`;

              return (
                <div
                  key={friend.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: friend.isCurrentUser ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-card)',
                    border: friend.isCurrentUser ? '1px solid var(--sky-border)' : '1px solid var(--border-hairline)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {/* Left: Rank, Avatar, Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      width: '28px',
                      fontSize: rank <= 3 ? '16px' : '12px',
                      fontWeight: 700,
                      color: rank <= 3 ? 'inherit' : 'var(--text-muted)',
                      textAlign: 'center'
                    }} className="mono">
                      {medal}
                    </span>

                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      border: '1px solid var(--border-hairline)'
                    }}>
                      {friend.avatarEmoji}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: friend.isCurrentUser ? 'var(--sky)' : 'var(--text-pure)'
                        }}>
                          {friend.displayName}
                        </span>
                        {friend.isCurrentUser && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'var(--sky-subtle)',
                            color: 'var(--sky)'
                          }}>
                            YOU
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10.5px',
                          color: 'var(--amber)',
                          fontWeight: 700
                        }} className="mono">
                          <Flame size={11} fill="var(--amber)" />
                          {friend.streak}d
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {friend.roleTitle} • {friend.lastActiveText}
                      </div>
                    </div>
                  </div>

                  {/* Right: Study Stats & Cheer actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-pure)' }} className="mono">
                        {friend.weeklyMinutes} min
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {friend.weeklyHabits} habits done
                      </div>
                    </div>

                    {!friend.isCurrentUser && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleSendCheer(friend.id, 'high_five')}
                          title="Send High-Five"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <span>🎉 High Five</span>
                        </button>

                        <button
                          onClick={() => handleSendCheer(friend.id, 'nudge')}
                          title="Send Study Reminder"
                          style={{
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sky)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Bell size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Friend Quests (Duolingo Duo Challenges) */}
      {activeTab === 'quests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {quests.map(quest => {
            const pct = Math.min(100, Math.round((quest.currentProgress / quest.targetGoal) * 100));

            return (
              <div
                key={quest.id}
                className="panel-card"
                style={{
                  padding: '22px 24px',
                  backgroundColor: quest.isCompleted ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-surface)',
                  borderColor: quest.isCompleted ? 'var(--emerald-border)' : 'var(--border-hairline)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {quest.partnerAvatar}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)', margin: 0 }}>
                          {quest.title}
                        </h4>
                        {quest.isCompleted && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'var(--emerald-subtle)',
                            color: 'var(--emerald)',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            <Check size={11} strokeWidth={2.5} />
                            COMPLETED
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--amber)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '11px',
                    fontWeight: 700
                  }} className="mono">
                    +{quest.rewardXP} XP
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Co-op Progress ({quest.currentProgress} / {quest.targetGoal} {quest.targetMetric})
                    </span>
                    <span style={{ color: 'var(--text-pure)', fontWeight: 600 }} className="mono">
                      {pct}%
                    </span>
                  </div>

                  <div style={{
                    height: '8px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: quest.isCompleted ? 'var(--emerald)' : 'var(--sky)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Partner: {quest.partnerName}</span>
                    <span>{quest.daysLeft} days remaining this week</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 3: Activity & High-Fives Feed */}
      {activeTab === 'activity' && (
        <div className="panel-card" style={{ padding: '22px 24px', backgroundColor: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
            Community Feed & High-Fives
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cheers.map(cheer => (
              <div
                key={cheer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    {cheer.senderAvatar}
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-pure)' }}>
                      <strong>{cheer.senderName}</strong> {cheer.message.replace(cheer.senderName, '')}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(cheer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSuccessChime(soundEnabled);
                    confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cheer back 🎉
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }} onClick={() => setIsAddModalOpen(false)}>
          <div
            className="animate-pop"
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-pure)', margin: 0 }}>
                Add a Study Buddy
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Enter your friend's <strong>Friend Code</strong> (e.g. <span className="mono">CAD-1024</span>) or display name to connect.
            </p>

            <form onSubmit={handleAddFriend}>
              <input
                type="text"
                placeholder="e.g. CAD-4096 or Alex"
                value={friendCodeInput}
                onChange={e => {
                  setFriendCodeInput(e.target.value);
                  setAddError(null);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  marginBottom: '10px'
                }}
                autoFocus
              />

              {addError && (
                <div style={{ fontSize: '11.5px', color: 'var(--rose)', marginBottom: '10px' }}>
                  {addError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)',
                    fontSize: '12.5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--sky)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Connect Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
