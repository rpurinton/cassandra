-- Schema for 'cassandra' database with unique indexes on fields

DROP TABLE IF EXISTS `history`;

CREATE TABLE `history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `adjective` VARCHAR(64) NOT NULL,
  `verb` VARCHAR(64) NOT NULL,
  `noun` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_adjective` (`adjective`),
  UNIQUE INDEX `uniq_verb` (`verb`),
  UNIQUE INDEX `uniq_noun` (`noun`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
