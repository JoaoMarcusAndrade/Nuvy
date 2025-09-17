import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

function geraNome() {
  let randomStr = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 12; i++) {
    const indice = Math.floor(Math.random() * characters.length);
    randomStr += characters[indice];
  }
  return randomStr;
}

// RESPONSAVEIS
export const Responsaveis = sequelize.define('Responsaveis', {
  ID_responsaveis: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  password_resp: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  email_resp: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [6, 254]
    }
  }
});

// CONTROLE (pivot)
export const Controle = sequelize.define('Controle', {
  ID_responsaveis: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_usuarios: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  limitado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tempoTela: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  horaLimite: {
    type: DataTypes.TIME,
    defaultValue: "00:00:00"
  }
}, {
  tableName: 'Controle',
  freezeTableName: true
});

// USUARIOS
export const Usuarios = sequelize.define('Usuarios', {
  ID_usuarios: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  password_user: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  email_user: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [6, 254]
    }
  },
  name_user: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: geraNome
  },
  XP_user: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  responsavel_vinculado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// RELACIONAMENTOS
Responsaveis.belongsToMany(Usuarios, {
  through: Controle,
  foreignKey: 'ID_responsaveis',
  otherKey: 'ID_usuarios'
});

Usuarios.belongsToMany(Responsaveis, {
  through: Controle,
  foreignKey: 'ID_usuarios',
  otherKey: 'ID_responsaveis'
});

Controle.belongsTo(Responsaveis, { foreignKey: 'ID_responsaveis' });
Controle.belongsTo(Usuarios, { foreignKey: 'ID_usuarios' });

sequelize.sync().then(() => {
  console.log("Tabelas criadas!");
});
