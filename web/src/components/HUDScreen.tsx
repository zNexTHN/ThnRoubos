import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Shield } from 'lucide-react';

interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  isTeamKill: boolean;
  timestamp: number;
}

interface SquadMember {
  id: string;
  name: string;
  avatar: string;
  health: number;
  armor: number;
  isAlive: boolean;
}

interface HUDScreenProps {
  timeRemaining: number;
  totalTime: number;
  killFeed: KillFeedEntry[];
  squad: SquadMember[];
}

export function HUDScreen({ killFeed, squad }: Omit<HUDScreenProps, 'timeRemaining' | 'totalTime'>) {
  return (
    <div className="fixed inset-0 pointer-events-none">

      {/* Top Left - Kill Feed */}
      <div className="absolute top-6 left-6 space-y-2 max-w-sm">
        <AnimatePresence>
          {killFeed.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-lg px-4 py-2 flex items-center gap-2 text-sm"
            >
              <Skull className="w-4 h-4 text-primary flex-shrink-0" />
              <span className={entry.isTeamKill ? 'text-secondary' : 'text-primary'}>
                [{entry.isTeamKill ? 'ALIADO' : 'INIMIGO'}]
              </span>
              <span className="text-foreground font-medium">{entry.killer}</span>
              <span className="text-muted-foreground">matou</span>
              <span className="text-foreground font-medium">{entry.victim}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Right Side - Squad List */}
      <div className="absolute top-6 right-6 space-y-2 w-56">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Shield className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Equipe
            </span>
          </div>

          <div className="space-y-3">
            {squad.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`flex items-center gap-3 ${!member.isAlive ? 'opacity-60' : ''}`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold ${
                      !member.isAlive ? 'bg-primary/30' : ''
                    }`}
                    style={{
                      backgroundImage: `url(${member.avatar})`,
                      backgroundSize: 'cover',
                    }}
                  >
                    {!member.avatar && member.name.charAt(0)}
                  </div>
                  {!member.isAlive && (
                    <Skull className="absolute -bottom-1 -right-1 w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Name and Bars */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      !member.isAlive ? 'text-primary line-through' : 'text-foreground'
                    }`}
                  >
                    {member.name}
                  </p>
                  {member.isAlive && (
                    <div className="space-y-1 mt-1">
                      {/* Health Bar */}
                      <div className="health-bar h-1.5">
                        <div
                          className={`health-bar-fill ${member.health < 30 ? 'critical' : ''}`}
                          style={{ width: `${member.health}%` }}
                        />
                      </div>
                      {/* Armor Bar */}
                      {member.armor > 0 && (
                        <div className="health-bar h-1">
                          <div
                            className="armor-bar-fill"
                            style={{ width: `${member.armor}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
