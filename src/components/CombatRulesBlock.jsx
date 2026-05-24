import React from 'react';
import GoldRuleMark from './GoldRuleMark';
import dragonDecor from '../assets/rules/dragon-silhouette.png';
import styles from './CombatRulesBlock.module.css';

const ITEMS = [
  {
    title: 'Перемещение',
    text:
      'В свой ход вы можете переместиться на расстояние, не превышающее вашу скорость. Перемещение можно разбивать: до действия, между атаками и после — пока не исчерпан запас футов.',
  },
  {
    title: 'Основное действие',
    text:
      'Одно главное действие за ход: атака, сотворение заклинания, Рывок, Засада, Помощь, Уклонение, Захват и другие варианты из правил и класса.',
  },
  {
    title: 'Бонусное действие',
    text:
      'Используется только если умение или заклинание явно требует бонусного действия. За ход не больше одного такого действия.',
  },
  {
    title: 'Реакция',
    text:
      'Особый ответ вне своего хода (например, провоцированная атака). Реакция восстанавливается в начале вашего следующего хода. Порядок ходов задаёт инициатива; вне своей очереди вы действуете редко и осознанно.',
  },
];

export default function CombatRulesBlock() {
  return (
    <div className={styles.wrap}>
      <div
        className={styles.dragonLayer}
        aria-hidden
        style={{ backgroundImage: `url(${dragonDecor})` }}
      />
      <div className={styles.content}>
        <p className={styles.lead}>
          Бой делится на раунды. В каждом раунде участники по очереди совершают ход: сначала перемещение и действия согласно правилам, затем следующий боец.
        </p>
        <ul className={styles.list}>
          {ITEMS.map((item) => (
            <li key={item.title} className={styles.item}>
              <GoldRuleMark className={styles.mark} />
              <div>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemText}>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
