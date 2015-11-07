-- phpMyAdmin SQL Dump
-- version 4.2.6deb1
-- http://www.phpmyadmin.net
--
-- Client :  localhost
-- Généré le :  Mar 13 Janvier 2015 à 04:21
-- Version du serveur :  5.5.40-0ubuntu1
-- Version de PHP :  5.5.12-2ubuntu4.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données :  `bkperfdashboard`
--
CREATE DATABASE IF NOT EXISTS `bkperfdashboard` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE `bkperfdashboard`;

-- --------------------------------------------------------

--
-- Structure de la table `account`
--

DROP TABLE IF EXISTS `account`;
CREATE TABLE IF NOT EXISTS `account` (
`id` int(11) NOT NULL,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `ga_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `ga_refresh` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `ga_ios` bigint(20) DEFAULT NULL,
  `ga_android` bigint(20) DEFAULT NULL,
  `af_has_account` tinyint(1) NOT NULL,
  `af_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `af_token_secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `af_ios` bigint(20) DEFAULT NULL,
  `af_android` bigint(20) DEFAULT NULL,
  `ua_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `ua_master` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15 ;

--
-- Contenu de la table `account`
--

INSERT INTO `account` (`id`, `name`, `ga_token`, `ga_refresh`, `ga_ios`, `ga_android`, `af_has_account`, `af_token`, `af_token_secret`, `af_ios`, `af_android`, `ua_key`, `ua_master`) VALUES
(1, 'Backelite', 'abcdbYbarhPYudiYok2WU0tYLV96OgZwfp7BV8kiWUjsWdQHN_B7NYtgjDma4rhVxyy8Fmgeuw', 'abcdHuEErVL-OnWykB2PG5RzWSTCFRxUUT3L9uo', 71356700, 64849424, 1, 'abcdtkj6akJ6L', 'bcdaHbvQ9FBfQ', 212947864, 5558282, 'abcdrQU24DSd8-i56Kg', 'abcdL6jjZsJNJFw'),
(2, 'Epita', 'abcdqXxDp5imLymNF_nBHPdpERwVytMIvxffFJgkXSOXGgdEKsX7BUvYRfnqWlHhJ8ifJgqMA', 'abcdxYvI9KhtllYrAenL76kQgi1a5ZWJfWf4IMEudVrK5jSpoR30zcRFq6', 71356700, 64849424, 0, 'abcdwgDDml4', 'abcdjqAjCicUn', 212947864, 5558282, 'abcdQU24DSd8-i56Kg', 'abcdCL6jjZsJNJFw'),
(3, 'Test', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'ADMIN', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Test2', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'Test3', 'abcdLe_ngvlTpr7KlZWQKgx9f9e3H2jt9EszgYUXMh4fG_mp0DjN_owhGihZOgqYRC7YJ8A', 'abcdQP2WCiIsDY2s9OxlfDS_YvmjhFBt9MxQXSJAMEudVrK5jSpoR30zcRFq6', 71356700, 64849424, 0, 'abcdAAMkYB2bK4', 'abcdBaBcKDGJ', 5982635, 5558282, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
`id` int(11) NOT NULL,
  `type` varchar(7) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `id_account` int(11) NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=57 ;

--
-- Contenu de la table `user`
--

INSERT INTO `user` (`id`, `type`, `email`, `password`, `id_account`) VALUES
(1, 'client', 'tommy.lopes@backelite.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 1),
(2, 'client', 'tommy.lopes@epita.fr', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 2),
(4, 'client', 'tommyblopes@msn.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 3),
(5, 'user', 'user@backelite.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 1),
(6, 'admin', 'perfdashboard@backelite.com', '5d5e3fac9e539c91baa4120776f2ed90fb32d65a0d2f472dbc51e383f27eb550', 4),
(15, 'user', 'user2@backelite.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 1),
(16, 'client', 'client@backelite.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 1),
(54, 'admin', 'admin@backelite.com', '5d5e3fac9e539c91baa4120776f2ed90fb32d65a0d2f472dbc51e383f27eb550', 4),
(55, 'user', 'user@test3.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 14),
(56, 'client', 'client@test3.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 14);

--
-- Index pour les tables exportées
--

--
-- Index pour la table `account`
--
ALTER TABLE `account`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
 ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables exportées
--

--
-- AUTO_INCREMENT pour la table `account`
--
ALTER TABLE `account`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=15;
--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=57;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
